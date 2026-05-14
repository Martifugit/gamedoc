import { useMemo } from "react"
import type { Section } from "@/lib/gamedoc-types"
import { Variable as VarIcon } from "lucide-react"
import { PickerPopover, type PickerItem } from "./picker-popover"
import type { PickerHandle } from "@/lib/types"

interface FlatVariable {
  id: string
  name: string
  value: string
  sectionId: string
  sectionTitle: string
  /** Lower score = shown first */
  priority: number
}

export function VariablePicker({
  allSections,
  ref,
  onPick,
  currentSectionId,
}: {
  allSections: Section[]
  ref?: React.RefObject<PickerHandle | null>
  onPick: (id: string, name: string) => void
  /** Id of the section the user is currently editing — boosts those variables */
  currentSectionId?: string
}) {
  const allVars = useMemo<FlatVariable[]>(() => {
    const list: FlatVariable[] = []
    allSections.forEach((s, si) => {
      s.variables.forEach((v, vi) => {
        list.push({
          id: v.id,
          name: v.name,
          value: v.value,
          sectionId: s.id,
          sectionTitle: s.title || "Untitled",
          priority: s.id === currentSectionId ? vi : (si + 1) * 1000 + vi,
        })
      })
    })
    return list
  }, [allSections, currentSectionId])

  function getItems(query: string): PickerItem<{ id: string; name: string }>[] {
    const q = query.trim().toLowerCase()
    return allVars
      .filter(
        (v) =>
          !q ||
          v.name.toLowerCase().includes(q) ||
          v.value.toLowerCase().includes(q) ||
          v.sectionTitle.toLowerCase().includes(q)
      )
      .sort((a, b) => a.priority - b.priority)
      .map((v) => ({
        id: v.id,
        render: () => (
          <>
            <span className="mr-1 text-xs tracking-wide text-muted-foreground uppercase">
              {v.sectionTitle} ›
            </span>
            <span className="font-medium">{v.name || "(unnamed)"}</span>{" "}
            <span className="text-xs text-muted-foreground">= {v.value}</span>
          </>
        ),
        onPick: () => ({ id: v.id, name: v.name }),
      }))
  }

  return (
    <PickerPopover
      ref={ref}
      icon={<VarIcon className="h-3 w-3" />}
      label="Variable"
      placeholder="Search variables…"
      onSelect={({ id, name }) => onPick(id, name)}
      getItems={getItems}
      emptyMessage="No variables match"
      width="w-80"
      title="Focus a field, then use this to add a Variable Reference"
    />
  )
}
