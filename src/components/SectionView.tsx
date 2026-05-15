import {
  ChevronRight,
  Edit,
  MoreVertical,
  Plus,
  Trash2,
  Variable as VarIcon,
} from "lucide-react"
import { Button } from "./ui/button"
import {
  newContainer,
  uid,
  type Container,
  type Ctx,
  type Section,
} from "@/lib/gamedoc-types"
import { useRef, useState } from "react"
import { cn, sectionId } from "@/lib/utils"
import { ConfirmDelete } from "./ConfirmDelete"
import { VariablesPanel } from "./VariablesPanel"
import { ContainerView } from "./ContainerView"
import { Textarea } from "./ui/textarea"
import { useEditorInput } from "@/hooks/use-editable-input"
import { useLocalDraft } from "@/hooks/use-local-draft"
import { useMoveHighlight } from "@/hooks/use-move-highlight"
import { useIsStuck } from "@/hooks/use-is-stuck"
import { CommentsPopover } from "./comments"
import { useScopeHighlight } from "@/hooks/use-scope-highlight"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"

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
  const { ref: sectionRef, highlightMoved, triggerMove } = useMoveHighlight()
  const { highlight: highlightComment } = useScopeHighlight(
    {
      kind: "section",
      sectionId: section.id,
    },
    2000
  )

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
      data-editor-section
      ref={sectionRef}
      id={sectionId(section.id)}
      onMouseEnter={() => onSetCurrentSectionId(section.id)}
      onMouseLeave={() => onSetCurrentSectionId(undefined)}
      className={cn(
        "relative scroll-mt-12 rounded-xl border border-border px-3 pt-6 pb-4 ring-1 ring-transparent transition-colors md:px-6 md:pt-4 md:pb-6",
        (highlightMoved || highlightComment) && "ring-blue-500"
      )}
    >
      <span className="absolute -top-2.5 bg-background px-3 text-sm text-muted-foreground">
        Section
      </span>
      <SectionHeader
        section={section}
        onChange={onChange}
        onMove={handleMove}
        onRemove={onRemove}
      />

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
    <div className="group relative flex min-w-0 flex-1 [&:focus-within_.edit-icon]:opacity-0">
      <input
        spellCheck="false"
        value={draft.value}
        onBlur={draft.onBlur}
        onChange={(e) => draft.onChange(e.target.value)}
        className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 text-xl tracking-tight outline-none focus-visible:border-border md:text-2xl"
        placeholder="New Section Title..."
      />
      <Edit className="edit-icon pointer-events-none absolute top-1/2 right-1 h-4 w-4 -translate-y-1/2 opacity-0 group-hover:opacity-100" />
    </div>
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

function SectionHeader({
  section,
  onChange,
  onRemove,
  onMove,
}: {
  section: Section
  onChange: (fn: (s: Section) => Section) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
}) {
  const [showVars, setShowVars] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const isStuck = useIsStuck(headerRef)

  return (
    <div
      ref={headerRef}
      className={cn(
        "sticky top-4 z-25 grid h-max grid-cols-1 gap-2 rounded-lg border bg-background pt-3 transition-all",
        isStuck
          ? "-mx-4 border-border px-12 md:-mx-3 md:px-4"
          : "mx-0 border-transparent px-0",
        showVars ? "pb-6" : "pb-3"
      )}
    >
      <div
        className={cn(
          "flex min-w-0 items-center gap-2 transition-[margin]",
          showVars ? "mb-2" : "mb-0"
        )}
      >
        {/* flex-1 + min-w-0 lets the input grow without overflowing */}
        <SectionTitleInput onChange={onChange} title={section.title} />

        <SectionActions
          onMove={onMove}
          onRemove={onRemove}
          onSetShowVars={setShowVars}
          section={section}
          showVars={showVars}
          varsCount={section.variables.length}
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
  )
}

function SectionActions({
  onMove,
  onRemove,
  onSetShowVars,
  section,
  showVars,
  varsCount,
}: {
  showVars: boolean
  section: Section
  varsCount: number
  onSetShowVars: React.Dispatch<React.SetStateAction<boolean>>
  onMove: (dir: 1 | -1) => void
  onRemove: () => void
}) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <div className="hidden items-center gap-0.5 md:flex">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-10 w-10 gap-1",
            showVars && "bg-muted hover:bg-muted/90"
          )}
          onClick={() => onSetShowVars((v) => !v)}
          title="Variables"
        >
          <VarIcon />
          <span className="text-xs">{varsCount}</span>
        </Button>
        <Button
          className="h-10 w-10"
          variant="ghost"
          size="sm"
          onClick={() => onMove(-1)}
          title="Move up"
        >
          <ChevronRight className="-rotate-90" />
        </Button>
        <Button
          className="h-10 w-10"
          variant="ghost"
          size="sm"
          onClick={() => onMove(1)}
          title="Move down"
        >
          <ChevronRight className="rotate-90" />
        </Button>

        <CommentsPopover
          triggerClassName="h-10 w-10"
          scope={{ kind: "section", sectionId: section.id }}
        />

        <ConfirmDelete
          title="Delete this section?"
          description={`"${section.title || "Untitled"}" and all its containers and variables will be removed.`}
          onConfirm={onRemove}
          trigger={
            <Button
              className="h-10 w-10"
              variant="ghost"
              size="icon"
              title="Delete section"
            >
              <Trash2 className="text-destructive" />
            </Button>
          }
        />
      </div>

      <CommentsPopover
        triggerClassName="md:hidden flex h-8 w-8"
        scope={{ kind: "section", sectionId: section.id }}
      />

      {/* Mobile */}
      <div className="flex md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40 space-y-1" align="end">
            <DropdownMenuItem onClick={() => onMove(-1)}>
              <ChevronRight className="h-4 w-4 -rotate-90" />
              Move Up
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMove(1)}>
              <ChevronRight className="h-4 w-4 rotate-90" />
              Move Down
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => onSetShowVars((v) => !v)}>
              <VarIcon />
              Show Variables
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <ConfirmDelete
                title="Delete this section?"
                description={`"${section.title || "Untitled"}" and its contents will be removed.`}
                onConfirm={onRemove}
                trigger={
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 px-1! hover:bg-destructive/10!"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="text-destructive">Delete</span>
                  </Button>
                }
              />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
