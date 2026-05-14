import { useCallback, useEffect, useRef, useState } from "react"
import { useGameDoc } from "@/lib/gamedoc-store"
import {
  type Ctx,
  type GameDoc,
  type Variable,
  newSection,
} from "@/lib/gamedoc-types"
import { RotateCcw } from "lucide-react"

import { slug } from "@/lib/utils"
import { buildHeadingsMap } from "@/lib/reference-syntax"
import { SectionView } from "./SectionView"
import { GameDocPreview } from "./Preview"
import { ReferencesToolbar } from "./ReferencesToolbar"
import { useMongoCredentials } from "@/hooks/use-mongo-creds"
import { useDbSync } from "@/hooks/use-db-sync"
import { EditorToolbar } from "./EditorToolbar"
import { SelectProjectTypeModal } from "./SelectProjectTypeModal"
import { SettingsModal } from "./SettingsModal"
import { SyncAuthModal } from "./SyncAuthModal"
import { LeftAside } from "./LeftAside"
import { RightAside } from "./RightAside"
// import { GameDocViewer } from "./GameDocViewer"

export type EditorView = "preview" | "editor" /* | "json-preview"  */

export function GameDocEditor() {
  const storageKey = "is_new_project"

  const { doc, setDoc, clearCurrentDoc, loaded } = useGameDoc()
  const [query, setQuery] = useState("")
  const [view, setView] = useState<EditorView>("preview")
  const [syncModalState, setSyncModalState] = useState<"load" | "save" | null>(
    null
  )
  const [autoSync, setAutoSync] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isNewProject, setIsNewProject] = useState<boolean>(() => {
    const saved = localStorage.getItem(storageKey)
    return saved === null ? true : saved === "true"
  })

  const fileRef = useRef<HTMLInputElement>(null)
  const didInitialLoad = useRef(false)

  // Stable ref so useDbSync can always read the latest doc without
  // being included in its dependency array.
  const docRef = useRef(doc)
  useEffect(() => {
    docRef.current = doc
  }, [doc])

  const { credentials, saveCredentials, clearCredentials } =
    useMongoCredentials()
  const { syncStatus, loadFromDb, saveToDb } = useDbSync(
    credentials,
    setDoc,
    () => docRef.current
  )

  const update = useCallback(
    (fn: (d: GameDoc) => GameDoc) => setDoc((d) => (d ? fn(d) : d)),
    [setDoc]
  )

  useEffect(() => {
    localStorage.setItem(storageKey, String(isNewProject))
  }, [isNewProject])

  useEffect(() => {
    if (isNewProject || didInitialLoad.current) return
    if (!credentials) return
    didInitialLoad.current = true
    loadFromDb()
  }, [isNewProject, credentials, loadFromDb])

  // Auto-sync to DB every 30 s when enabled
  useEffect(() => {
    if (!autoSync) return
    const id = setInterval(() => saveToDb(), 30_000)
    return () => clearInterval(id)
  }, [autoSync, saveToDb])

  // ── Handlers passed into SyncModal ─────────────────────────────────────────

  const handleSyncSubmit = useCallback(
    async (pw: string, intent: "load" | "save") => {
      saveCredentials(pw)

      if (intent === "save") {
        const ok = await saveToDb(pw)
        if (ok) setSyncModalState(null)
      } else {
        const ok = await loadFromDb(pw)
        if (ok) setSyncModalState(null)
      }
    },
    [saveCredentials, saveToDb, loadFromDb]
  )

  // ── Quick save/load (credentials already stored) ────────────────────────────

  const onQuickSave = useCallback(async () => {
    if (!credentials) {
      setSyncModalState("save")
      return
    }
    await saveToDb()
  }, [credentials, saveToDb])

  const onQuickLoad = useCallback(async () => {
    if (!credentials) {
      setSyncModalState("load")
      return
    }
    await loadFromDb()
  }, [credentials, loadFromDb])

  // ── File I/O ────────────────────────────────────────────────────────────────

  const onExport = () => {
    if (!doc) return
    const blob = new Blob([JSON.stringify(doc, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${slug(doc.title) || "gamedoc"}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const onImport = async (file: File) => {
    const text = await file.text()
    try {
      const parsed = JSON.parse(text) as GameDoc
      if (parsed && Array.isArray(parsed.sections)) setDoc(parsed)
    } catch {
      // TODO: surface this as a proper toast rather than alert
      alert("Invalid file")
    }
  }

  // ── Early returns ───────────────────────────────────────────────────────────

  if (isNewProject === null) {
    return (
      <SelectProjectTypeModal
        updateProjectType={(isNew) => setIsNewProject(isNew)}
      />
    )
  }

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-muted-foreground">
        <RotateCcw className="h-4 w-4 shrink-0 animate-spin" /> Loading…
      </div>
    )
  }

  const headings = doc ? buildHeadingsMap(doc) : new Map()
  const allVars = new Map<string, Variable>()
  if (doc) {
    doc.sections.map((s) => s.variables.map((v) => allVars.set(v.id, v)))
  }
  const ctx: Ctx = { headings, vars: allVars }

  const addSection = () =>
    update((d) => ({ ...d, sections: [...d.sections, newSection()] }))

  const isBusy = syncStatus.state === "loading" || syncStatus.state === "saving"

  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto flex max-w-450">
        <LeftAside
          doc={doc}
          query={query}
          setQuery={setQuery}
          onReorder={(next) => update(() => next)}
        />

        <main className="relative min-w-0 flex-1 space-y-8 pt-6">
          <div className="sticky top-0 z-20 h-0">
            <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-background via-background to-transparent" />
          </div>

          {doc && view === "editor" && (
            <CenterEditorView ctx={ctx} doc={doc} update={update} />
          )}
          {doc && view === "preview" && <GameDocPreview doc={doc} ctx={ctx} />}
          {/* {view === "json-preview" && <GameDocViewer doc={doc} />} */}

          {/* Sticky toolbar */}
          <EditorToolbar
            isBusy={isBusy}
            ctx={ctx}
            doc={doc}
            fileRef={fileRef}
            syncStatus={syncStatus}
            view={view}
            onExport={onExport}
            onQuickLoad={onQuickLoad}
            onQuickSave={onQuickSave}
            onSetView={setView}
            onAddSection={addSection}
            onOpenSettings={() => setSettingsOpen(true)}
          />

          <div className="sticky bottom-0 z-20 h-0">
            <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-background to-transparent" />
          </div>
        </main>

        <RightAside
          doc={doc}
          onChangeSection={(sIdx, fn) =>
            update((d) => ({
              ...d,
              sections: d.sections.map((s, i) => (i === sIdx ? fn(s) : s)),
            }))
          }
        />
      </div>

      {!!syncModalState && (
        <SyncAuthModal
          intent={syncModalState}
          open={syncModalState !== null}
          isBusy={isBusy}
          syncError={syncStatus.state === "error" ? syncStatus.message : null}
          defaultCredentials={credentials}
          onSubmit={handleSyncSubmit}
          onClose={() => setSyncModalState(null)}
        />
      )}

      <SettingsModal
        open={settingsOpen}
        autoSync={autoSync}
        hasCredentials={!!credentials}
        onSetOpen={setSettingsOpen}
        onClearCurrentDoc={clearCurrentDoc}
        onToggleAutoSync={() => setAutoSync((v) => !v)}
        onClearCredentials={clearCredentials}
      />

      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onImport(f)
          e.target.value = ""
        }}
      />
    </div>
  )
}

function CenterEditorView({
  doc,
  ctx,
  update,
}: {
  doc: GameDoc
  ctx: Ctx
  update: (fn: (d: GameDoc) => GameDoc) => void
}) {
  const [curSecId, setCurSecId] = useState<string | undefined>(undefined)

  return (
    <div className="min-h-screen space-y-8 p-6">
      <header className="relative z-25 flex items-start justify-between">
        <div className="space-y-2">
          <input
            value={doc.title}
            onChange={(e) => update((d) => ({ ...d, title: e.target.value }))}
            className="w-full rounded border border-transparent bg-transparent px-1 text-4xl font-bold tracking-tight outline-none focus-visible:border-border"
            placeholder="Document title"
          />
          <p className="ml-1 text-xs text-muted-foreground">
            Last saved {new Date(doc.updatedAt).toLocaleTimeString()} ·
            <span className="ml-1 rounded bg-primary-foreground px-1 py-0.5 text-primary">
              auto-saved locally
            </span>
          </p>
        </div>
      </header>

      {doc.sections.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
          No sections yet. Click <b>New Section</b> to get started.
        </div>
      )}

      {doc.sections.map((section, sIdx) => (
        <SectionView
          onSetCurrentSectionId={setCurSecId}
          key={section.id}
          section={section}
          ctx={ctx}
          allSections={doc.sections}
          onChange={(updater) =>
            update((d) => ({
              ...d,
              sections: d.sections.map((s, i) => (i === sIdx ? updater(s) : s)),
            }))
          }
          onRemove={() =>
            update((d) => ({
              ...d,
              sections: d.sections.filter((_, i) => i !== sIdx),
            }))
          }
          onMove={(dir) =>
            update((d) => {
              const arr = [...d.sections]
              const j = sIdx + dir
              if (j < 0 || j >= arr.length) return d
              ;[arr[sIdx], arr[j]] = [arr[j], arr[sIdx]]
              return { ...d, sections: arr }
            })
          }
        />
      ))}

      <ReferencesToolbar
        currentSectionId={curSecId}
        allSections={doc.sections}
      />
    </div>
  )
}
