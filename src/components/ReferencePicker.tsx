import type { Section } from "@/lib/gamedoc-types"
import { useMemo, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Button } from "./ui/button"
import { Hash } from "lucide-react"
import { Input } from "./ui/input"
import { formatReference } from "@/lib/reference-syntax"

export function ReferencePicker({
  allSections,
  onPick,
}: {
  allSections: Section[]
  onPick: (ref: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const items = useMemo(() => {
    const list: { ref: string; label: string; group: string }[] = []
    allSections.forEach((s) => {
      list.push({
        ref: formatReference({ type: "section", sectionId: s.id, sectionName: s.title || "Untitled" }),
        label: s.title || "Untitled",
        group: "Sections",
      })
      s.containers.forEach((c) =>
        list.push({
          ref: formatReference({ type: "heading", sectionId: s.id, containerId: c.id, headingName: c.title || "Untitled" }),
          label: c.title || "Untitled",
          group: s.title || "Untitled",
        })
      )
    })
    return list.filter((i) => i.label.toLowerCase().includes(q.toLowerCase()))
  }, [allSections, q])
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs">
          <Hash className="h-3 w-3" /> Reference
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="w-72 p-2">
        <Input
          placeholder="Search headings…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="mb-2 h-8"
        />
        <div className="max-h-64 overflow-y-auto">
          {items.map((i) => (
            <button
              key={i.ref}
              className="block w-full truncate rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
              onClick={() => {
                onPick(i.ref)
                setOpen(false)
              }}
            >
              <span className="text-xs text-muted-foreground">{i.group} ›</span>{" "}
              {i.label}
            </button>
          ))}
          {items.length === 0 && (
            <p className="p-2 text-xs text-muted-foreground">No headings</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
