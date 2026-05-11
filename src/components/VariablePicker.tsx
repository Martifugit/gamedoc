import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import type { Section } from "@/lib/gamedoc-types"
import { Variable as VarIcon } from "lucide-react"

export function VariablePicker({
  allSections,
  onPick,
}: {
  allSections: Section[]
  onPick: (id: string, name: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const ql = q.trim().toLowerCase()
  const filtered = allSections
    .map((s) => ({
      s,
      vars: s.variables.filter(
        (v) =>
          !ql ||
          v.name.toLowerCase().includes(ql) ||
          v.value.toLowerCase().includes(ql) ||
          s.title.toLowerCase().includes(ql)
      ),
    }))
    .filter((g) => g.vars.length > 0)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs">
          <VarIcon className="h-3 w-3" /> Variable
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="w-80 p-2">
        <Input
          autoFocus
          placeholder="Search variables…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="mb-2 h-8"
        />
        <div className="max-h-64 space-y-3 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">
              No variables match
            </p>
          )}
          {filtered.map(({ s, vars }) => (
            <div key={s.id}>
              <p className="px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {s.title || "Untitled"}
              </p>
              {vars.map((v) => (
                <button
                  key={v.id}
                  className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => {
                    onPick(v.id, v.name)
                    setOpen(false)
                    setQ("")
                  }}
                >
                  <span className="font-medium">{v.name || "(unnamed)"}</span>{" "}
                  <span className="text-xs text-muted-foreground">
                    = {v.value}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
