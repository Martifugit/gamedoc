import type { Section } from "@/lib/gamedoc-types"
import { useMemo } from "react"
import { Hash } from "lucide-react"
import { formatReference } from "@/lib/reference-syntax"
import { PickerPopover, type PickerItem } from "./picker-popover"
import type { PickerHandle } from "@/lib/types"

interface ReferenceItem {
  ref: string
  label: string
  group: string
  /** Lower score = shown first */
  priority: number
}

export function ReferencePicker({
  ref,
  allSections,
  onPick,
  currentSectionId,
}: {
  ref?: React.RefObject<PickerHandle | null>
  allSections: Section[]
  onPick: (ref: string) => void
  /** Id of the section the user is currently editing — boosts those results */
  currentSectionId?: string
}) {
  const allItems = useMemo<ReferenceItem[]>(() => {
    const list: ReferenceItem[] = []
    allSections.forEach((s, si) => {
      const sectionPriority = s.id === currentSectionId ? 0 : si + 1
      list.push({
        ref: formatReference({
          type: "section",
          sectionId: s.id,
          sectionName: s.title || "Untitled",
        }),
        label: s.title || "Untitled",
        group: "Sections",
        priority: sectionPriority,
      })
      s.containers.forEach((c, ci) =>
        list.push({
          ref: formatReference({
            type: "heading",
            sectionId: s.id,
            containerId: c.id,
            headingName: c.title || "Untitled",
          }),
          label: c.title || "Untitled",
          group: s.title || "Untitled",
          // Containers of the current section rank first, then by doc order
          priority: s.id === currentSectionId ? ci : (si + 1) * 1000 + ci,
        })
      )
    })
    return list
  }, [allSections, currentSectionId])

  function getItems(query: string): PickerItem<string>[] {
    const q = query.toLowerCase()
    return allItems
      .filter(
        (i) =>
          !q ||
          i.label.toLowerCase().includes(q) ||
          i.group.toLowerCase().includes(q)
      )
      .sort((a, b) => a.priority - b.priority)
      .map((i) => ({
        id: i.ref,
        render: () => (
          <>
            <span className="text-xs text-muted-foreground">{i.group} ›</span>{" "}
            {i.label}
          </>
        ),
        onPick: () => i.ref,
      }))
  }

  return (
    <PickerPopover
      ref={ref}
      icon={<Hash className="h-3 w-3" />}
      label="Reference"
      placeholder="Search headings…"
      onSelect={onPick}
      getItems={getItems}
      emptyMessage="No headings"
      width="w-72"
    />
  )
}
