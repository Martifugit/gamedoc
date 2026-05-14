import {
  ChevronRight,
  ClipboardPaste,
  Copy,
  Edit,
  MoreVertical,
  Plus,
  Trash2,
} from "lucide-react"
import { Button } from "./ui/button"
import {
  uid,
  type Block,
  type Container,
  type Ctx,
  type HeadingLevelCssString,
  type Section,
} from "@/lib/gamedoc-types"

import { cn, headingId } from "@/lib/utils"
import { KeyValueView } from "./KeyValueView"
import { BlockView } from "./BlockView"
import { ConfirmDelete } from "./ConfirmDelete"
import { RefCopyButton } from "./RefCopyButton"
import { HeadingSelect } from "./heading-select"
import { useLocalDraft } from "@/hooks/use-local-draft"
import { useClipboard, type ClipboardItem } from "@/context/use-clipboard"
import { cloneBlock } from "@/lib/clipboard-clone"
import { useMoveHighlight } from "@/hooks/use-move-highlight"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"

export function ContainerView({
  container,
  sectionId: secId,
  ctx,
  allSections,
  onChange,
  onRemove,
  onMove,
  onDuplicate,
}: {
  container: Container
  sectionId: string
  ctx: Ctx
  allSections: Section[]
  onChange: (fn: (c: Container) => Container) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
  onDuplicate: () => void
}) {
  const HeadingTag = `h${container.level}` as HeadingLevelCssString

  const addBlock = (b: Block) =>
    onChange((c) => ({ ...c, blocks: [...c.blocks, b] }))

  const { item } = useClipboard()
  const {
    ref: containerRef,
    highlightMoved,
    triggerMove,
  } = useMoveHighlight<HTMLDivElement>()

  const handlePaste = () => {
    if (!item) return
    const [kind, clone] = cloneBlock(item)
    if (kind === "block") {
      onChange((c) => ({ ...c, blocks: [...c.blocks, clone] }))
    } else {
      onChange((c) => ({
        ...c,
        keyValues: [...(c.keyValues ?? []), clone],
      }))
    }
  }

  const handleMove = (dir: -1 | 1) => {
    onMove(dir)
    triggerMove()
  }

  return (
    <div
      ref={containerRef}
      id={headingId(secId, container.id)}
      className={cn(
        "group relative scroll-mt-26 rounded-lg border p-4 transition-colors",
        highlightMoved ? "border-blue-500" : "border-border/60"
      )}
    >
      <span className="absolute -top-2 bg-background px-3 text-xs text-muted-foreground">
        Container
      </span>
      <div className="mb-3 flex items-center gap-2">
        <HeadingSelect
          value={container.level}
          onChange={(v) => onChange((c) => ({ ...c, level: v }))}
        />
        <HeadingTag className={`min-w-0 flex-1 text-2xl`}>
          <ContainerTitleInput onChange={onChange} title={container.title} />
        </HeadingTag>

        <ContainerActions
          secId={secId}
          container={container}
          item={item}
          onMove={handleMove}
          onPaste={handlePaste}
          onDuplicate={onDuplicate}
          onRemove={onRemove}
        />
      </div>

      <div className="space-y-3">
        {container.blocks.map((b, i) => (
          <BlockView
            key={b.id}
            block={b}
            ctx={ctx}
            allSections={allSections}
            onChange={(fn) =>
              onChange((c) => ({
                ...c,
                blocks: c.blocks.map((x, j) => (j === i ? fn(x) : x)),
              }))
            }
            onRemove={() =>
              onChange((c) => ({
                ...c,
                blocks: c.blocks.filter((_, j) => j !== i),
              }))
            }
          />
        ))}
      </div>

      {container.keyValues?.map((kv, i) => (
        <KeyValueView
          ctx={ctx}
          allSections={allSections}
          key={`kv-view-${i}`}
          keyValue={kv}
          onChange={(fn) =>
            onChange((c) => ({
              ...c,
              keyValues: c.keyValues?.map((x, j) => (j === i ? fn(x) : x)),
            }))
          }
          onRemove={() =>
            onChange((c) => ({
              ...c,
              keyValues: c.keyValues?.filter((_, j) => j !== i),
            }))
          }
        />
      ))}

      <div className="relative mt-4 flex flex-wrap gap-2 rounded-md border border-blue-500/20 p-3">
        <span className="absolute -top-2 left-2 bg-background px-3 text-xs text-muted-foreground">
          Add Blocks
        </span>

        <Button
          size="sm"
          variant="ghost"
          className="gap-1"
          onClick={() => addBlock({ id: uid(), type: "paragraph", text: "" })}
        >
          <Plus className="h-3.5 w-3.5" /> Paragraph
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="gap-1"
          onClick={() =>
            addBlock({ id: uid(), type: "list", ordered: false, items: [""] })
          }
        >
          <Plus className="h-3.5 w-3.5" /> List
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="gap-1"
          onClick={() =>
            addBlock({
              id: uid(),
              type: "table",
              headers: ["Column 1", "Column 2"],
              rows: [["", ""]],
            })
          }
        >
          <Plus className="h-3.5 w-3.5" /> Table
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="gap-1"
          onClick={() =>
            onChange((c) => ({
              ...c,
              keyValues: [
                ...(c.keyValues ?? []),
                { id: uid(), pairs: [{ id: uid(), key: "", value: "" }] },
              ],
            }))
          }
        >
          <Plus className="h-3.5 w-3.5" /> Key-Value Set
        </Button>
      </div>
    </div>
  )
}

function ContainerTitleInput({
  title,
  onChange,
}: {
  title: string
  onChange: (fn: (c: Container) => Container) => void
}) {
  const draft = useLocalDraft(title, (value) =>
    onChange((s) => ({ ...s, title: value }))
  )
  return (
    <div className="group relative [&:focus-within_.edit-icon]:opacity-0">
      <input
        value={draft.value}
        onBlur={draft.onBlur}
        onChange={(e) => draft.onChange(e.target.value)}
        className="w-full rounded border border-transparent bg-transparent px-1 text-base outline-none focus-visible:border-border md:text-lg"
        placeholder="New Heading..."
        title={title}
        spellCheck={false}
      />
      <Edit className="edit-icon absolute top-1/2 right-1 h-4 w-4 -translate-y-1/2 opacity-0 group-hover:opacity-100" />
    </div>
  )
}

interface ContainerActionsProps {
  secId: string
  container: Container
  item?: ClipboardItem | null
  onMove: (direction: -1 | 1) => void
  onPaste: () => void
  onDuplicate: () => void
  onRemove: () => void
}

export function ContainerActions({
  secId,
  container,
  item,
  onMove,
  onPaste,
  onDuplicate,
  onRemove,
}: ContainerActionsProps) {
  const deleteAction = (
    <ConfirmDelete
      title="Delete this container?"
      description={`"${container.title || "Untitled"}" and its contents will be removed.`}
      onConfirm={onRemove}
      trigger={
        <Button variant="ghost" size="icon" title="Delete container">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      }
    />
  )

  return (
    <div className="flex items-center gap-0.5">
      <RefCopyButton
        sectionId={secId}
        containerId={container.id}
        name={container.title}
      />

      {/* Desktop */}
      <div className="hidden items-center gap-0.5 md:flex">
        <Button variant="ghost" size="icon" onClick={() => onMove(-1)}>
          <ChevronRight className="h-4 w-4 -rotate-90" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onMove(1)}>
          <ChevronRight className="h-4 w-4 rotate-90" />
        </Button>
        {item && (
          <Button
            onClick={onPaste}
            className="relative z-1 h-8.5 w-8.5 transition-opacity group-hover:opacity-100 md:opacity-0"
            title="Paste Block"
            variant="ghost"
          >
            <ClipboardPaste />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onDuplicate}
          title="Duplicate container"
          className="transition-opacity group-hover:opacity-100 md:opacity-0"
        >
          <Copy className="h-4 w-4" />
        </Button>
        {deleteAction}
      </div>

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
            {item && (
              <DropdownMenuItem onClick={onPaste}>
                <ClipboardPaste className="h-4 w-4" />
                Paste Block
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <ConfirmDelete
                title="Delete this container?"
                description={`"${container.title || "Untitled"}" and its contents will be removed.`}
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
