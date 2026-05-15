import { useRef, useState, useCallback, useMemo, useEffect } from "react"
import { ChevronRight, GripVertical } from "lucide-react"
import { cn, headingId, sectionId, truncate } from "@/lib/utils"
import type { GameDoc } from "@/lib/gamedoc-types"
import { SidebarShell } from "./sidebar-shell"

type FlatItem =
  | { type: "section"; id: string; label: string; si: number }
  | {
      type: "container"
      id: string
      label: string
      si: number
      ci: number
      level: number
    }

function buildFlat(doc: GameDoc): FlatItem[] {
  const out: FlatItem[] = []
  doc.sections.forEach((s, si) => {
    out.push({ type: "section", id: s.id, label: s.title, si })
    s.containers.forEach((c, ci) => {
      out.push({
        type: "container",
        id: c.id,
        label: c.title,
        si,
        ci,
        level: c.level,
      })
    })
  })
  return out
}

function applyReorder(doc: GameDoc, fromIdx: number, toIdx: number): GameDoc {
  const flat = buildFlat(doc)
  const src = flat[fromIdx]
  const sections = doc.sections.map((s) => ({
    ...s,
    containers: [...s.containers],
  }))

  if (src.type === "section") {
    const [sec] = sections.splice(src.si, 1)
    const flatAfter = buildFlat({ ...doc, sections })
    const adjTo = toIdx > fromIdx ? toIdx - 1 - sec.containers.length : toIdx
    let insertAt = 0
    let pos = 0
    for (const item of flatAfter) {
      if (pos >= Math.max(0, adjTo)) break
      if (item.type === "section") insertAt = item.si + 1
      pos++
    }
    sections.splice(insertAt, 0, sec)
  } else {
    const [con] = sections[src.si].containers.splice(src.ci, 1)
    const flatAfter = buildFlat({ ...doc, sections })
    const adjTo = Math.min(
      toIdx > fromIdx ? toIdx - 1 : toIdx,
      flatAfter.length
    )
    if (adjTo >= flatAfter.length) {
      sections[sections.length - 1].containers.push(con)
    } else {
      const dest = flatAfter[adjTo]
      if (dest.type === "section") {
        sections[dest.si].containers.unshift(con)
      } else {
        sections[dest.si].containers.splice(dest.ci, 0, con)
      }
    }
  }

  return { ...doc, sections }
}

const renderIndentationDots = (level: number) => {
  const dots = []
  for (let i = 1; i < level; i++) {
    dots.push(
      <span
        key={i}
        className="shrink-0 text-muted-foreground/40"
        style={{ width: "12px", textAlign: "center" }}
        aria-hidden="true"
      >
        ·
      </span>
    )
  }
  return dots
}

// ── Filtered view item ───────────────────────────────────────────────────────

type FilteredSection = GameDoc["sections"][number]

function FilteredSectionItem({
  section,
  matches,
}: {
  section: FilteredSection
  matches: (s: string) => boolean
}) {
  const childMatches = section.containers.filter((c) => matches(c.title))
  const showSection = matches(section.title) || childMatches.length > 0
  if (!showSection) return null

  return (
    <li className="group">
      <a
        href={`#${sectionId(section.id)}`}
        className="block truncate rounded px-2 py-1.5 font-medium hover:bg-accent focus-visible:bg-accent/40 focus-visible:outline-0"
        title={section.title}
      >
        {section.title || "Untitled"}
      </a>
      {childMatches.length > 0 && (
        <ul className="space-y-0.5">
          {childMatches.map((c) => (
            <li key={c.id}>
              <a
                href={`#${headingId(section.id, c.id)}`}
                title={c.title}
                className="flex items-center truncate rounded px-2 py-1 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:bg-accent/40 focus-visible:outline-0"
              >
                <div
                  className="mr-1.5 flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ width: `${(c.level - 1) * 16}px` }}
                >
                  {renderIndentationDots(c.level)}
                </div>
                <span className="truncate">{c.title || "Untitled"}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

// ── Drag-and-drop view item ──────────────────────────────────────────────────

function DraggableFlatItem({
  item,
  idx,
  flat,
  dropIdx,
  dragIdx,
  collapsedIds,
  itemRef,
  onPointerDown,
  onToggleCollapse,
}: {
  item: FlatItem
  idx: number
  flat: FlatItem[]
  dropIdx: number | null
  dragIdx: number | null
  collapsedIds: Set<string>
  itemRef: (el: HTMLDivElement | null) => void
  onPointerDown: (e: React.PointerEvent, idx: number) => void
  onToggleCollapse: (id: string) => void
}) {
  const isCollapsed = item.type === "section" && collapsedIds.has(item.id)

  return (
    <div className="group/item relative" key={item.id}>
      {item.type !== "section" && (
        <div className="absolute inset-y-0 left-3 w-px bg-border opacity-0 transition-opacity group-hover:opacity-100" />
      )}
      <div
        className={cn(
          "mx-2 h-0.5 rounded-full bg-primary transition-opacity",
          dropIdx === idx ? "opacity-100" : "opacity-0"
        )}
      />
      <div
        ref={itemRef}
        className={cn(
          "group relative flex",
          item.type === "container" && "pl-3",
          dragIdx === idx && "opacity-30"
        )}
      >
        {item.type === "section" && (
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded p-1.5 font-medium hover:bg-accent focus-visible:bg-accent/40 focus-visible:outline-0">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleCollapse(item.id)
              }}
              className="shrink-0 text-foreground/60 transition-transform hover:text-foreground"
              aria-label={isCollapsed ? "Expand section" : "Collapse section"}
            >
              <ChevronRight
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  !isCollapsed && "rotate-90"
                )}
              />
            </button>
            <a
              href={`#${sectionId(item.id)}`}
              title={item.label}
              className={cn(
                "truncate",
                dragIdx !== null && "pointer-events-none"
              )}
            >
              {truncate(item.label, { length: 20 }) || "Untitled"}
            </a>
          </div>
        )}

        {item.type === "container" && (
          <>
            <div
              className="ml-1 flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              style={{ width: `${(item.level - 1) * 16}px` }}
            >
              {renderIndentationDots(item.level)}
            </div>
            <a
              href={`#${headingId(
                flat.find((f) => f.si === item.si && f.type === "section")
                  ?.id ?? "",
                item.id
              )}`}
              title={item.label}
              className={cn(
                "flex min-w-0 flex-1 items-center truncate rounded px-2 py-1 text-foreground/70 hover:bg-accent hover:text-foreground focus-visible:bg-accent/40 focus-visible:outline-0",
                dragIdx !== null && "pointer-events-none"
              )}
            >
              <span className="truncate">
                {truncate(item.label, { length: 20 - item.level }) ||
                  "Untitled"}
              </span>
            </a>
          </>
        )}
        <div
          onPointerDown={(e) => onPointerDown(e, idx)}
          className="absolute top-1/2 right-3 -translate-y-1/2 cursor-grab touch-none p-1 opacity-0 group-hover/item:opacity-100 active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground/60" />
        </div>
      </div>
    </div>
  )
}

// ── LeftAside ────────────────────────────────────────────────────────────────

export function LeftAside({
  doc,
  onReorder,
}: {
  doc: GameDoc | null
  onReorder: (next: GameDoc) => void
}) {
  const [q, setQ] = useState("")
  const matches = (s: string) => !q || s.toLowerCase().includes(q)

  const total = doc ? doc.sections.length : 0
  const flat = useMemo(() => (doc ? buildFlat(doc) : []), [doc])

  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dropIdx, setDropIdx] = useState<number | null>(null)
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())

  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const visibleFlat = useMemo(() => {
    if (!doc) return []
    const fullFlat = buildFlat(doc)
    return fullFlat.filter((item) => {
      // Always show sections
      if (item.type === "section") return true
      // Find the section this container belongs to
      const parentSection = doc.sections[item.si]
      // Hide if the parent section's ID is in our collapsed set
      return !collapsedIds.has(parentSection.id)
    })
  }, [doc, collapsedIds])

  const onReorderRef = useRef(onReorder)
  useEffect(() => {
    onReorderRef.current = onReorder
  }, [onReorder])

  const findDropTarget = useCallback(
    (clientY: number) => {
      let best = flat.length
      for (let i = 0; i < itemRefs.current.length; i++) {
        const el = itemRefs.current[i]
        if (!el) continue
        const rect = el.getBoundingClientRect()
        if (clientY <= rect.top + rect.height / 2) {
          best = i
          break
        }
      }
      return best
    },
    [flat.length]
  )

  const onPointerDown = useCallback((e: React.PointerEvent, idx: number) => {
    if (e.button !== 0) return
    e.preventDefault()
    setDragIdx(idx)
  }, [])

  useEffect(() => {
    if (dragIdx === null || !doc) return
    const onMove = (e: PointerEvent) => setDropIdx(findDropTarget(e.clientY))
    const onUp = () => {
      setDropIdx((drop) => {
        if (drop !== null && drop !== dragIdx && drop !== dragIdx + 1) {
          // Map visible indices → full flat indices
          const fullFlat = buildFlat(doc!)
          const toFullIdx = (visIdx: number) => {
            const visItem = visibleFlat[visIdx]
            if (!visItem) return fullFlat.length
            return fullFlat.findIndex((f) => f.id === visItem.id)
          }
          const fullFrom = toFullIdx(dragIdx)
          const fullTo =
            drop >= visibleFlat.length ? fullFlat.length : toFullIdx(drop)

          // If dragging a collapsed section, applyReorder must move its children too.
          // Since applyReorder already moves the whole section (including containers),
          // this works correctly as long as we pass full-flat indices.
          onReorderRef.current(applyReorder(doc!, fullFrom, fullTo))
        }
        return null
      })
      setDragIdx(null)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
  }, [dragIdx, doc, findDropTarget, visibleFlat])

  return (
    <SidebarShell
      side="left"
      title={`Sections (${total})`}
      shortcutLabel="ctrl+q"
      searchPlaceholder="Search sections…"
      searchQuery={q}
      onSearchChange={setQ}
      searchDisabled={total === 0}
    >
      <p className="px-2 pb-2 text-xs text-muted-foreground">
        Table of contents
      </p>
      {!doc && <p>No Document Available</p>}

      {q && doc && (
        // ── Filtered view ──────────────────────────────────────────────
        <ul className="space-y-0.5">
          {doc.sections.map((s) => (
            <FilteredSectionItem key={s.id} section={s} matches={matches} />
          ))}
        </ul>
      )}

      {!q && doc && (
        // ── Drag-and-drop view ─────────────────────────────────────────
        <div>
          {visibleFlat.map((item, idx) => (
            <DraggableFlatItem
              key={item.id}
              item={item}
              idx={idx}
              flat={flat}
              collapsedIds={collapsedIds}
              onToggleCollapse={toggleCollapse}
              dropIdx={dropIdx}
              dragIdx={dragIdx}
              itemRef={(el) => {
                itemRefs.current[idx] = el
              }}
              onPointerDown={onPointerDown}
            />
          ))}
          <div
            className={cn(
              "mx-2 h-0.5 rounded-full bg-primary transition-opacity",
              dropIdx === flat.length ? "opacity-100" : "opacity-0"
            )}
          />
        </div>
      )}
    </SidebarShell>
  )
}
