import { Edit, Hash, Plus, Search, SidebarClose, Trash2 } from "lucide-react"
import { Input } from "./ui/input"
import {
  uid,
  type GameDoc,
  type Section,
  type Variable,
} from "@/lib/gamedoc-types"
import { cn, sectionId } from "@/lib/utils"
import { useEffect, useState } from "react"
import { ConfirmDelete } from "./ConfirmDelete"
import { ScrollArea } from "./ui/scroll-area"
import { Button } from "./ui/button"
import { Checkbox } from "./ui/checkbox"

export function VariablesSidebar({
  doc,
  onChangeSection,
}: {
  doc: GameDoc | null
  onChangeSection: (sIdx: number, fn: (s: Section) => Section) => void
}) {
  const [isEditingSectionVars, setIsEditingSectionVars] = useState("")
  const [selectedVarIds, setSelectedVarIds] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const ql = q.trim().toLowerCase()
  const total = doc
    ? doc.sections.reduce((n, s) => n + s.variables.length, 0)
    : 0

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "g" && e.ctrlKey) {
        e.preventDefault()
        e.stopPropagation()
        setOpen((p) => !p)
      }
    }

    window.addEventListener("keydown", handleKeydown, true)

    return () => window.removeEventListener("keydown", handleKeydown, true)
  }, [])

  const toggleSelected = (id: string) => {
    setSelectedVarIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Clear selection when leaving edit mode
  const setEditingSection = (id: string) => {
    setIsEditingSectionVars((prev) => {
      const nextId = prev === id ? "" : id
      if (nextId !== prev) setSelectedVarIds(new Set())
      return nextId
    })
  }

  // Bulk delete handler
  const handleBulkDelete = (sIdx: number, sId: string) => {
    onChangeSection(sIdx, (sec) => ({
      ...sec,
      variables: sec.variables.filter((v) => !selectedVarIds.has(v.id)),
    }))
    setSelectedVarIds(new Set())
    setIsEditingSectionVars("")
    setEditingSection(sId)
  }

  const toggleEditingSection = (id: string) => {
    setIsEditingSectionVars((prev) => {
      const closing = prev === id
      if (closing) setSelectedVarIds(new Set())
      return closing ? "" : id
    })
  }

  return (
    <aside
      className={cn(
        "relative min-h-screen shrink-0 border-l border-border/50 px-4 py-6 transition-[width]",
        open ? "w-72" : "w-12 hover:bg-card/20"
      )}
      title={!open ? "Open Sidebar" : undefined}
      onClick={() => {
        if (open) return
        setOpen(true)
      }}
    >
      <div className="sticky top-6 flex h-screen min-h-0 flex-col gap-4">
        <div
          className={cn(
            "flex flex-nowrap items-center justify-between transition-opacity",
            open ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          <Button
            title="(ctrl+g)"
            onClick={() => setOpen(!open)}
            variant="ghost"
            size="icon"
          >
            <SidebarClose className={open ? "rotate-180" : "rotate-0"} />
          </Button>

          <p className="text-xs font-semibold tracking-wide text-nowrap text-muted-foreground uppercase">
            Variables ({total})
          </p>
        </div>
        <div
          className={cn(
            "relative transition-opacity",
            open ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search variables…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="rounded-md bg-transparent! pl-8"
          />
        </div>

        <div
          className={cn(
            "flex min-h-0 flex-1 overflow-hidden text-sm transition-opacity",
            open ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          <ScrollArea className="max-h-[calc(100vh-9rem)] min-h-0 pr-3">
            <div className="space-y-4">
              {(!doc || doc?.sections.length === 0) && (
                <p className="text-xs text-muted-foreground">
                  Add a section to define variables.
                </p>
              )}
              {doc &&
                doc.sections.map((s, sIdx) => {
                  const vars = s.variables.filter(
                    (v) =>
                      !ql ||
                      v.name.toLowerCase().includes(ql) ||
                      v.value.toLowerCase().includes(ql) ||
                      s.title.toLowerCase().includes(ql)
                  )

                  const selectedInSection = s.variables.filter((v) =>
                    selectedVarIds.has(v.id)
                  ).length

                  if (ql && vars.length === 0) return null
                  return (
                    <div key={s.id} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <a
                          href={`#${sectionId(s.id)}`}
                          className="truncate text-xs font-semibold tracking-wide text-muted-foreground uppercase hover:text-foreground"
                        >
                          {s.title || "Untitled"}
                        </a>
                        <div className="flex items-center gap-1.5">
                          {selectedVarIds.size > 0 && selectedInSection && (
                            <ConfirmDelete
                              title={`Delete ${selectedInSection} variable${selectedInSection === 1 ? "" : "s"}?`}
                              description="References to deleted variables will show as “?”."
                              onConfirm={() => handleBulkDelete(sIdx, s.id)}
                              trigger={
                                <button className="flex h-5 items-center gap-0.5 rounded-xs px-1 text-xs text-destructive hover:bg-destructive/30 hover:text-white">
                                  <Trash2 size={14} />{" "}
                                  {`(${selectedVarIds.size})`}
                                </button>
                              }
                            />
                          )}
                          <button
                            className={cn(
                              "focus-visible:outline-0",
                              isEditingSectionVars === s.id
                                ? "text-blue-400 hover:text-blue-400/80"
                                : "text-foreground hover:text-foreground/80"
                            )}
                            title="Edit Vars"
                            onClick={() => {
                              toggleEditingSection(s.id)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            className="text-foreground hover:text-foreground"
                            title="Add variable"
                            onClick={() =>
                              onChangeSection(sIdx, (sec) => ({
                                ...sec,
                                variables: [
                                  ...sec.variables,
                                  { id: uid(), name: "", value: "" },
                                ],
                              }))
                            }
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {s.variables.length === 0 && !ql && (
                        <p className="text-xs text-muted-foreground/60">
                          No variables
                        </p>
                      )}
                      {vars.map((v) => {
                        const realIdx = s.variables.findIndex(
                          (x) => x.id === v.id
                        )
                        return (
                          <Variable
                            key={v.id}
                            onChangeSection={onChangeSection}
                            realIdx={realIdx}
                            sectionIdx={sIdx}
                            variable={v}
                            isEditingVars={s.id === isEditingSectionVars}
                            onCheckedChange={() => toggleSelected(v.id)}
                            checked={selectedVarIds.has(v.id)}
                          />
                        )
                      })}
                    </div>
                  )
                })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </aside>
  )
}

function Variable({
  variable,
  isEditingVars,
  sectionIdx,
  realIdx,
  checked,
  onChangeSection,
  onCheckedChange,
}: {
  variable: Variable
  sectionIdx: number
  realIdx: number
  isEditingVars: boolean
  checked: boolean
  onChangeSection: (sIdx: number, fn: (s: Section) => Section) => void
  onCheckedChange: () => void
}) {
  const [localVarName, setLocalVarName] = useState(variable.name)
  const [localVarVal, setLocalVarVal] = useState(variable.value)

  const classes = isEditingVars
    ? "grid-cols-[1fr_auto_1fr_1fr]"
    : "grid-cols-[1fr_auto_1fr]"

  return (
    <div key={variable.id} className={cn("grid gap-1", classes)}>
      <Input
        value={localVarName}
        placeholder="name"
        className={cn(
          "h-6 flex-1 border border-border/80 bg-transparent! px-4 text-xs! text-muted-foreground shadow-none focus-visible:border-border focus-visible:text-foreground focus-visible:ring-0",
          isEditingVars && "w-25"
        )}
        onBlur={(e) => setLocalVarName(e.currentTarget.value)}
        onChange={() =>
          onChangeSection(sectionIdx, (sec) => ({
            ...sec,
            variables: sec.variables.map((x, j) =>
              j === realIdx ? { ...x, name: localVarName } : x
            ),
          }))
        }
      />
      <span className="text-lg text-muted-foreground">:</span>
      <Input
        value={localVarVal}
        placeholder="value"
        className={cn(
          "h-6 border border-border/80 bg-transparent! px-4 text-right text-xs! text-muted-foreground shadow-none focus-visible:border-border focus-visible:text-foreground focus-visible:ring-0",
          isEditingVars ? "w-12 shrink" : "flex-1"
        )}
        onChange={(e) => setLocalVarVal(e.currentTarget.value)}
        onBlur={() =>
          onChangeSection(sectionIdx, (sec) => ({
            ...sec,
            variables: sec.variables.map((x, j) =>
              j === realIdx ? { ...x, value: localVarVal } : x
            ),
          }))
        }
      />
      <div
        className={cn(
          "flex items-center gap-1 pl-1",
          !isEditingVars ? "hidden" : "visible"
        )}
      >
        <Checkbox
          checked={checked}
          onCheckedChange={onCheckedChange}
          className="h-5 w-5"
        />
        <Button
          size={"icon-xs"}
          variant={"ghost"}
          title="Copy reference"
          className="rounded-sm bg-muted! hover:bg-muted/80!"
          onClick={() =>
            navigator.clipboard.writeText(
              `{{var:${variable.id}:${variable.name}}}`
            )
          }
        >
          <Hash className="h-3 w-3 text-muted-foreground hover:text-foreground" />
        </Button>
        <ConfirmDelete
          title="Delete this variable?"
          description={`References to "${variable.name || "(unnamed)"}" will show as "?".`}
          onConfirm={() =>
            onChangeSection(sectionIdx, (sec) => ({
              ...sec,
              variables: sec.variables.filter((_, j) => j !== realIdx),
            }))
          }
          trigger={
            <Button
              size={"icon-xs"}
              variant={"destructive"}
              title="Delete"
              className="rounded-sm"
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          }
        />
      </div>
    </div>
  )
}
