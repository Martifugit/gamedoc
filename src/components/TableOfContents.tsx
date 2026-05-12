import { useRef, useState, useCallback, useMemo, useEffect } from "react"
import { Search, GripVertical } from "lucide-react"
import { Input } from "./ui/input"
import { cn, headingId, sectionId } from "@/lib/utils"
import type { GameDoc } from "@/lib/gamedoc-types"
import { ScrollArea } from "./ui/scroll-area"

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
        className="shrink-0 text-muted-foreground/60"
        style={{ width: "12px", textAlign: "center" }}
        aria-hidden="true"
      >
        ·
      </span>
    )
  }
  return dots
}

export function TableOfContents({
  doc,
  query,
  setQuery,
  onReorder,
}: {
  doc: GameDoc
  query: string
  setQuery: (s: string) => void
  onReorder: (next: GameDoc) => void
}) {
  const q = query.trim().toLowerCase()
  const matches = (s: string) => !q || s.toLowerCase().includes(q)
  const total = doc.sections.length
  const flat = useMemo(() => buildFlat(doc), [doc])

  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dropIdx, setDropIdx] = useState<number | null>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

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
    if (dragIdx === null) return

    const onMove = (e: PointerEvent) => setDropIdx(findDropTarget(e.clientY))

    const onUp = () => {
      setDropIdx((drop) => {
        if (drop !== null && drop !== dragIdx && drop !== dragIdx + 1) {
          onReorderRef.current(applyReorder(doc, dragIdx, drop))
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
  }, [dragIdx, doc, onReorder, findDropTarget])

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col gap-3 border-r border-border/50 px-4 py-6 lg:flex">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Sections ({total})
        </p>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search sections…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="rounded-md bg-transparent! pl-8"
        />
      </div>

      <nav className="flex min-h-0 flex-1 overflow-hidden text-sm">
        <ScrollArea className="min-h-0 flex-1 pr-1">
          <p className="px-2 pb-2 text-xs text-muted-foreground">
            Table of contents
          </p>

          {q ? (
            <ul className="space-y-0.5">
              {doc.sections.map((s) => {
                const childMatches = s.containers.filter((c) =>
                  matches(c.title)
                )
                const showSection = matches(s.title) || childMatches.length > 0
                if (!showSection) return null
                return (
                  <li key={s.id} className="group">
                    <a
                      href={`#${sectionId(s.id)}`}
                      className="block truncate rounded px-2 py-1.5 font-medium hover:bg-accent focus-visible:bg-accent/40 focus-visible:outline-0"
                      title={s.title}
                    >
                      {s.title || "Untitled"}
                    </a>
                    {childMatches.length > 0 && (
                      <ul className="space-y-0.5">
                        {childMatches.map((c) => (
                          <li key={c.id}>
                            <a
                              href={`#${headingId(s.id, c.id)}`}
                              title={c.title}
                              className="flex items-center truncate rounded px-2 py-1 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:bg-accent/40 focus-visible:outline-0"
                            >
                              <div
                                className="mr-1.5 flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                                style={{ width: `${(c.level - 1) * 16}px` }}
                              >
                                {renderIndentationDots(c.level)}
                              </div>
                              <span className="truncate">
                                {c.title || "Untitled"}
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <div>
              {flat.map((item, idx) => (
                <div key={item.id}>
                  <div
                    className={cn(
                      "mx-2 h-0.5 rounded-full bg-primary transition-opacity",
                      dropIdx === idx ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div
                    ref={(el) => {
                      itemRefs.current[idx] = el
                    }}
                    className={cn(
                      "group flex items-center gap-1 rounded",
                      item.type === "container" && "pl-3",
                      dragIdx === idx && "opacity-30"
                    )}
                  >
                    {item.type === "section" ? (
                      <a
                        href={`#${sectionId(item.id)}`}
                        title={item.label}
                        className={cn(
                          "min-w-0 flex-1 truncate rounded px-2 py-1.5 font-medium hover:bg-accent focus-visible:bg-accent/40 focus-visible:outline-0",
                          dragIdx !== null && "pointer-events-none"
                        )}
                      >
                        {item.label || "Untitled"}
                      </a>
                    ) : (
                      <a
                        href={`#${headingId(flat.find((f) => f.si === item.si && f.type === "section")!.id, item.id)}`}
                        title={item.label}
                        className={cn(
                          "flex min-w-0 flex-1 items-center truncate rounded py-1 pr-2 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:bg-accent/40 focus-visible:outline-0",
                          dragIdx !== null && "pointer-events-none"
                        )}
                      >
                        <div
                          className="mr-1.5 flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                          style={{ width: `${(item.level - 1) * 16}px` }}
                        >
                          {renderIndentationDots(item.level)}
                        </div>
                        <span className="truncate">
                          {item.label || "Untitled"}
                        </span>
                      </a>
                    )}
                    <div
                      onPointerDown={(e) => onPointerDown(e, idx)}
                      className="cursor-grab touch-none p-1 opacity-0 group-hover:opacity-100 active:cursor-grabbing"
                      aria-label="Drag to reorder"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground/60" />
                    </div>
                  </div>
                </div>
              ))}
              <div
                className={cn(
                  "mx-2 h-0.5 rounded-full bg-primary transition-opacity",
                  dropIdx === flat.length ? "opacity-100" : "opacity-0"
                )}
              />
            </div>
          )}
        </ScrollArea>
      </nav>
    </aside>
  )
}
