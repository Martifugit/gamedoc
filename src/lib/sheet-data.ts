import type { Block, GameDoc, HeadingLevel } from "./gamedoc-types"

const STEIN_URL = "https://api.steinhq.com/v1/storages/6a034abd92b1163e97f137dc"

export const GOOGLE_SHEETS = {
  metadata: "metadata",
  sections: "sections",
  containers: "containers",
  blocks: "blocks",
  variables: "variables",
} as const

export type GoogleSheet = keyof typeof GOOGLE_SHEETS

// Flattened row types for Google Sheets.
// saveId is stamped on every row so a single GET filter can isolate one save.
export interface MetadataRow {
  title: string
  updatedAt: string | number
  saveId?: string
}

export interface SectionRow {
  id: string
  title: string
  description?: string
  saveId?: string
}

export interface ContainerRow {
  id: string
  sectionId: string // Foreign Key
  title: string
  level: string | number
  saveId?: string
}

export interface BlockRow {
  id: string
  containerId: string // Foreign Key
  type: "paragraph" | "list" | "table"
  text?: string
  items?: string // Comma-separated
  headers?: string // Comma-separated
  rows?: string // JSON stringified string[][]
  ordered?: string // "true" | "false" — list blocks only
  heading?: string // list blocks only
  headingLevel?: string // list blocks only
  saveId?: string
}

export interface VariableRow {
  id: string
  sectionId: string // Foreign Key
  name: string
  value: string
  saveId?: string
}

export type SheetRowMap = {
  metadata: MetadataRow
  sections: SectionRow
  containers: ContainerRow
  blocks: BlockRow
  variables: VariableRow
}

export type FetchError = {
  success: boolean
  error: string | null
}

// searchFilter maps to Stein's ?search[column]=value query syntax.
// Brackets are intentionally not percent-encoded: Stein expects them raw.
export async function getSheetData<K extends GoogleSheet>(
  sheet: K,
  user: string,
  pass: string,
  searchFilter?: Record<string, string>
): Promise<{ data: SheetRowMap[K][]; error: string | null }> {
  if (!STEIN_URL) return { data: [], error: "API URL not configured." }

  const encoded = btoa(`${user}:${pass}`)

  let url = `${STEIN_URL}/${GOOGLE_SHEETS[sheet]}`
  if (searchFilter) {
    const qs = Object.entries(searchFilter)
      .map(([k, v]) => `search[${k}]=${encodeURIComponent(v)}`)
      .join("&")
    url += `?${qs}`
  }

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${encoded}`,
        "Content-Type": "application/json",
      },
    })

    if (!res.ok) throw new Error(`Failed to fetch ${sheet}: ${res.statusText}`)

    const data = await res.json()
    return { data, error: null }
  } catch (error) {
    return {
      data: [],
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Deduplication safety net: collapses multiple rows with the same id down to the
// last occurrence (= most recently written). Required for sheets that accumulated
// stale duplicates under the old append-only save strategy.
function dedupeById<T extends { id: string }>(rows: T[]): T[] {
  const map = new Map<string, T>()
  for (const row of rows) {
    if (row.id) map.set(row.id, row)
  }
  return Array.from(map.values())
}

export async function fetchEntireGameDoc(
  user: string,
  pass: string
): Promise<GameDoc | null> {
  // 1. Fetch metadata first to discover the saveId of the latest save.
  const metaRes = await getSheetData(GOOGLE_SHEETS.metadata, user, pass)
  if (metaRes.error) {
    console.error("Critical error fetching metadata", metaRes.error)
    return null
  }

  // Last row in the sheet = most recently appended = latest save.
  const latestMeta = metaRes.data[metaRes.data.length - 1]
  const saveId = latestMeta?.saveId

  // 2. Fetch remaining sheets.
  //    When saveId is present (new-format saves) we filter to only that save's rows,
  //    eliminating all previous saves without any DELETE calls.
  //    When saveId is absent (old-format saves) we fetch everything and rely on
  //    deduplication to collapse the stale duplicate rows.
  const filter = saveId ? { saveId } : undefined

  const [secs, cons, blks, vars] = await Promise.all([
    getSheetData(GOOGLE_SHEETS.sections, user, pass, filter),
    getSheetData(GOOGLE_SHEETS.containers, user, pass, filter),
    getSheetData(GOOGLE_SHEETS.blocks, user, pass, filter),
    getSheetData(GOOGLE_SHEETS.variables, user, pass, filter),
  ])

  if (secs.error) {
    console.error("Critical error fetching sections", secs.error)
    return null
  }

  const uniqueSecs = dedupeById(secs.data)
  const uniqueCons = dedupeById(cons.data)
  const uniqueBlks = dedupeById(blks.data)
  const uniqueVars = dedupeById(vars.data)

  const gameDoc: GameDoc = {
    title: latestMeta?.title || "Untitled",
    updatedAt: Number(latestMeta?.updatedAt),
    sections: uniqueSecs.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      variables: uniqueVars
        .filter((v) => v.sectionId === s.id)
        .map((v) => ({ id: v.id, name: v.name, value: v.value })),
      containers: uniqueCons
        .filter((c) => c.sectionId === s.id)
        .map((c) => ({
          id: c.id,
          title: c.title,
          level: Number(c.level) as HeadingLevel,
          blocks: uniqueBlks
            .filter((b) => b.containerId === c.id)
            .map((b): Block => {
              if (b.type === "paragraph") {
                return { id: b.id, type: "paragraph", text: b.text || "" }
              }
              if (b.type === "list") {
                return {
                  id: b.id,
                  type: "list",
                  ordered: b.ordered === "true",
                  heading: b.heading || undefined,
                  headingLevel: b.headingLevel
                    ? (Number(b.headingLevel) as HeadingLevel)
                    : undefined,
                  items: b.items ? b.items.split(",").map((i) => i.trim()) : [],
                }
              }
              // table
              return {
                id: b.id,
                type: "table",
                headers: b.headers
                  ? b.headers.split(",").map((h) => h.trim())
                  : [],
                rows: b.rows ? JSON.parse(b.rows) : [],
              }
            }),
        })),
    })),
  }

  console.log("Fetched data", gameDoc)
  return gameDoc
}

export async function saveEntireGameDoc(
  doc: GameDoc,
  user: string,
  pass: string
): Promise<{ success: boolean; error: string | null }> {
  if (!STEIN_URL) return { success: false, error: "API URL missing." }

  const encoded = btoa(`${user}:${pass}`)
  const headers = {
    Authorization: `Basic ${encoded}`,
    "Content-Type": "application/json",
  }

  // Unique marker for this save. All rows in this save share it.
  // On load, we filter by the saveId found in the latest metadata row.
  const saveId = String(Date.now())

  // 1. Prepare flat data arrays
  const metadata: MetadataRow[] = [
    { title: doc.title, updatedAt: Date.now(), saveId },
  ]
  const sections: SectionRow[] = []
  const containers: ContainerRow[] = []
  const blocks: BlockRow[] = []
  const variables: VariableRow[] = []

  doc.sections.forEach((s) => {
    sections.push({
      id: s.id,
      title: s.title,
      description: s.description,
      saveId,
    })

    s.variables.forEach((v) => {
      variables.push({
        id: v.id,
        sectionId: s.id,
        name: v.name,
        value: v.value,
        saveId,
      })
    })

    s.containers.forEach((c) => {
      containers.push({
        id: c.id,
        sectionId: s.id,
        title: c.title,
        level: c.level,
        saveId,
      })

      c.blocks.forEach((b) => {
        const row: BlockRow = {
          id: b.id,
          containerId: c.id,
          type: b.type,
          text: "",
          items: "",
          headers: "",
          rows: "",
          ordered: "",
          heading: "",
          headingLevel: "",
          saveId,
        }

        if (b.type === "paragraph") {
          row.text = b.text
        } else if (b.type === "list") {
          row.items = b.items.join(", ")
          row.ordered = String(b.ordered)
          row.heading = b.heading ?? ""
          row.headingLevel = String(b.headingLevel ?? "")
        } else if (b.type === "table") {
          row.headers = b.headers.join(", ")
          row.rows = JSON.stringify(b.rows)
        }

        blocks.push(row)
      })
    })
  })

  try {
    // 2. POST all entity rows in parallel (sections, containers, blocks, variables).
    //    Metadata is committed LAST so that a mid-save network failure doesn't
    //    advance the saveId pointer to an incomplete data set. If only the entity
    //    rows land but metadata never updates, the next load still reads the
    //    previous complete save.
    const entityRequests: Promise<Response>[] = []

    if (sections.length > 0)
      entityRequests.push(
        fetch(`${STEIN_URL}/${GOOGLE_SHEETS.sections}`, {
          method: "POST",
          headers,
          body: JSON.stringify(sections),
        })
      )
    if (containers.length > 0)
      entityRequests.push(
        fetch(`${STEIN_URL}/${GOOGLE_SHEETS.containers}`, {
          method: "POST",
          headers,
          body: JSON.stringify(containers),
        })
      )
    if (blocks.length > 0)
      entityRequests.push(
        fetch(`${STEIN_URL}/${GOOGLE_SHEETS.blocks}`, {
          method: "POST",
          headers,
          body: JSON.stringify(blocks),
        })
      )
    if (variables.length > 0)
      entityRequests.push(
        fetch(`${STEIN_URL}/${GOOGLE_SHEETS.variables}`, {
          method: "POST",
          headers,
          body: JSON.stringify(variables),
        })
      )

    await Promise.all(entityRequests)

    // 3. Commit: POST metadata with saveId. Once this row lands, any subsequent
    //    load will filter all sheets by this saveId and see only the rows we
    //    just wrote above.
    await fetch(`${STEIN_URL}/${GOOGLE_SHEETS.metadata}`, {
      method: "POST",
      headers,
      body: JSON.stringify(metadata),
    })

    console.log("Document save successful, saveId:", saveId)
    return { success: true, error: null }
  } catch (error) {
    console.error("Could not save doc", error)
    return {
      success: false,
      error: typeof error === "string" ? error : "Failed to save to database.",
    }
  }
}
