import { Hash, Plus, Search, Trash2 } from "lucide-react"
import { Input } from "./ui/input"
import {
  uid,
  type GameDoc,
  type Section,
  type Variable,
} from "@/lib/gamedoc-types"
import { sectionId } from "@/lib/utils"
import { useState } from "react"
import { ConfirmDelete } from "./ConfirmDelete"
import { ScrollArea } from "./ui/scroll-area"

export function VariablesSidebar({
  doc,
  onChangeSection,
}: {
  doc: GameDoc
  onChangeSection: (sIdx: number, fn: (s: Section) => Section) => void
}) {
  const [q, setQ] = useState("")
  const ql = q.trim().toLowerCase()
  const total = doc.sections.reduce((n, s) => n + s.variables.length, 0)

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col gap-3 border-l border-border px-4 py-6 xl:flex">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Variables ({total})
        </p>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search variables…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="rounded-md bg-transparent! pl-8"
        />
      </div>
      <div className="flex min-h-0 flex-1 overflow-hidden text-sm">
        <ScrollArea className="min-h-0 flex-1 pr-3">
          <div className="space-y-4">
            {doc.sections.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Add a section to define variables.
              </p>
            )}
            {doc.sections.map((s, sIdx) => {
              const vars = s.variables.filter(
                (v) =>
                  !ql ||
                  v.name.toLowerCase().includes(ql) ||
                  v.value.toLowerCase().includes(ql) ||
                  s.title.toLowerCase().includes(ql)
              )
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
                    <button
                      className="text-muted-foreground hover:text-foreground"
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
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {s.variables.length === 0 && !ql && (
                    <p className="text-xs text-muted-foreground/60">
                      No variables
                    </p>
                  )}
                  {vars.map((v) => {
                    const realIdx = s.variables.findIndex((x) => x.id === v.id)
                    return (
                      <Variable
                        key={v.id}
                        onChangeSection={onChangeSection}
                        realIdx={realIdx}
                        sectionIdx={sIdx}
                        variable={v}
                      />
                    )
                  })}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </div>
    </aside>
  )
}

function Variable({
  variable,
  onChangeSection,
  sectionIdx,
  realIdx,
}: {
  variable: Variable
  sectionIdx: number
  realIdx: number
  onChangeSection: (sIdx: number, fn: (s: Section) => Section) => void
}) {
  const [localVarName, setLocalVarName] = useState(variable.name)
  const [localVarVal, setLocalVarVal] = useState(variable.value)

  return (
    <div
      key={variable.id}
      className="group/var flex items-center gap-1 rounded border border-border/40 bg-muted/20 px-2 py-1"
    >
      <Input
        value={localVarName}
        placeholder="name"
        className="h-6 flex-1 border border-transparent bg-transparent px-4 text-xs shadow-none focus-visible:border-border focus-visible:ring-0"
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
      <span className="text-lg text-muted-foreground">=</span>
      <Input
        value={localVarVal}
        placeholder="value"
        className="h-6 w-20 border border-transparent bg-transparent px-4 text-xs shadow-none focus-visible:border-border focus-visible:ring-0"
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
      <button
        className="opacity-0 transition-opacity group-hover/var:opacity-100"
        title="Copy reference"
        onClick={() =>
          navigator.clipboard.writeText(
            `{{var:${variable.id}:${variable.name}}}`
          )
        }
      >
        <Hash className="h-3 w-3 text-muted-foreground hover:text-foreground" />
      </button>
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
          <button
            className="opacity-0 transition-opacity group-hover/var:opacity-100"
            title="Delete"
          >
            <Trash2 className="h-3 w-3 text-destructive" />
          </button>
        }
      />
    </div>
  )
}
