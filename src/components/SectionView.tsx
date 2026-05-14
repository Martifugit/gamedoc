import { ChevronRight, Plus, Trash2, Variable as VarIcon } from "lucide-react"
import { Button } from "./ui/button"
import {
  newContainer,
  uid,
  type Container,
  type Ctx,
  type Section,
} from "@/lib/gamedoc-types"
import { useEffect, useRef, useState } from "react"
import { cn, sectionId } from "@/lib/utils"
import { ConfirmDelete } from "./ConfirmDelete"
import { VariablesPanel } from "./VariablesPanel"
import { ContainerView } from "./ContainerView"
import { Textarea } from "./ui/textarea"
import { useEditorInput } from "@/hooks/use-editable-input"
import { useLocalDraft } from "@/hooks/use-local-draft"
import { useMoveHighlight } from "@/hooks/use-move-highlight"

export function SectionView({
  section,
  ctx,
  allSections,
  onSetCurrentSectionId,
  onChange,
  onRemove,
  onMove,
}: {
  section: Section
  ctx: Ctx
  allSections: Section[]
  onSetCurrentSectionId: React.Dispatch<
    React.SetStateAction<string | undefined>
  >
  onChange: (fn: (s: Section) => Section) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
}) {
  const [showVars, setShowVars] = useState(false)
  const [isStuck, setIsStuck] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)

  const { ref: sectionRef, highlightMoved, triggerMove } = useMoveHighlight()

  useEffect(() => {
    const onScroll = () => {
      const header = headerRef.current
      if (!header) return
      // When stuck, the header's top will equal the sticky offset (16px = top-4)
      // When not stuck, it will be higher (further down the page)
      setIsStuck(header.getBoundingClientRect().top <= 16)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const duplicateContainer = (container: Container, index: number) => {
    const duplicatedContainer = {
      ...container,
      id: uid(), // New ID for the container
      title: `${container.title} (Copy)`,
      blocks: container.blocks.map((block) => ({
        ...block,
        id: uid(), // New IDs for all blocks
      })),
      keyValues: container.keyValues?.map((kv) => ({
        ...kv,
        id: uid(),
        pairs: kv.pairs.map((pair) => ({
          ...pair,
          id: uid(),
        })),
      })),
    }

    onChange((s) => {
      const newContainers = [
        ...s.containers.slice(0, index + 1),
        duplicatedContainer,
        ...s.containers.slice(index + 1),
      ]
      console.log("New containers array length:", newContainers.length)
      return {
        ...s,
        containers: newContainers,
      }
    })
  }

  const handleMove = (dir: -1 | 1) => {
    onMove(dir)
    triggerMove()
  }

  return (
    <section
      ref={sectionRef}
      id={sectionId(section.id)}
      onMouseEnter={() => onSetCurrentSectionId(section.id)}
      onMouseLeave={() => onSetCurrentSectionId(undefined)}
      className={cn(
        "relative scroll-mt-6 rounded-xl border p-6 transition-colors",
        highlightMoved ? "border-blue-500" : "border-border"
      )}
    >
      <span className="absolute -top-2.5 bg-background px-3 text-sm text-muted-foreground">
        Section
      </span>
      <div
        ref={headerRef}
        className={cn(
          "sticky top-4 z-25 grid h-max grid-cols-1 gap-2 rounded-lg border bg-background py-3 transition-all",
          isStuck ? "border-border px-4" : "border-transparent px-0"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2 transition-[margin]",
            showVars ? "mb-2" : "mb-0"
          )}
        >
          <SectionTitleInput onChange={onChange} title={section.title} />

          <Button
            variant="ghost"
            size="sm"
            className={cn("gap-1", showVars && "bg-muted hover:bg-muted/90")}
            onClick={() => setShowVars((v) => !v)}
            title="Variables"
          >
            <VarIcon className="h-4 w-4" />
            <span className="text-xs">{section.variables.length}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleMove(-1)}
            title="Move up"
          >
            <ChevronRight className="h-4 w-4 -rotate-90" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleMove(1)}
            title="Move down"
          >
            <ChevronRight className="h-4 w-4 rotate-90" />
          </Button>
          <ConfirmDelete
            title="Delete this section?"
            description={`"${section.title || "Untitled"}" and all its containers and variables will be removed.`}
            onConfirm={onRemove}
            trigger={
              <Button variant="ghost" size="icon" title="Delete section">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            }
          />
        </div>

        {showVars && (
          <VariablesPanel
            section={section}
            onChange={onChange}
            onClose={() => setShowVars(false)}
          />
        )}
      </div>

      <SectionDescriptionInput
        description={section.description}
        onChange={onChange}
      />
      <div className="space-y-8">
        {section.containers.map((c, i) => (
          <ContainerView
            key={c.id}
            container={c}
            sectionId={section.id}
            ctx={ctx}
            allSections={allSections}
            onDuplicate={() => duplicateContainer(c, i)}
            onChange={(fn) =>
              onChange((s) => ({
                ...s,
                containers: s.containers.map((cc, j) =>
                  j === i ? fn(cc) : cc
                ),
              }))
            }
            onRemove={() =>
              onChange((s) => ({
                ...s,
                containers: s.containers.filter((_, j) => j !== i),
              }))
            }
            onMove={(dir) =>
              onChange((s) => {
                const arr = [...s.containers]
                const j = i + dir
                if (j < 0 || j >= arr.length) return s
                ;[arr[i], arr[j]] = [arr[j], arr[i]]
                return { ...s, containers: arr }
              })
            }
          />
        ))}
      </div>

      <div className="mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            onChange((s) => ({
              ...s,
              containers: [...s.containers, newContainer()],
            }))
          }
          className="gap-1"
        >
          <Plus className="h-4 w-4" /> Add container
        </Button>
      </div>
    </section>
  )
}

function SectionTitleInput({
  title,
  onChange,
}: {
  title: string
  onChange: (fn: (s: Section) => Section) => void
}) {
  const draft = useLocalDraft(title, (value) =>
    onChange((s) => ({ ...s, title: value }))
  )

  return (
    <input
      spellCheck="false"
      value={draft.value}
      onBlur={draft.onBlur}
      onChange={(e) => draft.onChange(e.target.value)}
      className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 text-2xl tracking-tight outline-none focus-visible:border-border"
      placeholder="New Section Title..."
    />
  )
}

function SectionDescriptionInput({
  description,
  onChange,
}: {
  description: string | undefined
  onChange: (fn: (s: Section) => Section) => void
}) {
  const draft = useLocalDraft(description, (value) =>
    onChange((s) => ({ ...s, description: value }))
  )

  const ref = useEditorInput<HTMLTextAreaElement>()

  return (
    <Textarea
      value={draft.value}
      onBlur={draft.onBlur}
      ref={ref}
      onChange={(e) => draft.onChange(e.target.value)}
      placeholder="Write an intro..."
      className="mb-4 min-h-18 resize-none border-transparent bg-transparent leading-relaxed text-muted-foreground focus-visible:border-border focus-visible:ring-0"
    />
  )
}
