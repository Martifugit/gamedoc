import type {
  Block,
  Ctx,
  ListBlock,
  ParagraphBlock,
  Section,
  TableBlock,
} from "@/lib/gamedoc-types"
import { Trash2 } from "lucide-react"
import { ConfirmDelete } from "./ConfirmDelete"
import { ParagraphView } from "./ParagraphView"
import { ListBlockView } from "./ListBlockView"
import { TableBlockView } from "./TableBlockView"
import { Button } from "./ui/button"
import { CopyButton } from "./copy-button"
import { CommentsPopover } from "./comments"

export function BlockView({
  block,
  ctx,
  allSections,
  sectionId,
  containerId,
  onChange,
  onRemove,
}: {
  block: Block
  ctx: Ctx
  allSections: Section[]
  sectionId: string
  containerId: string
  onChange: (fn: (b: Block) => Block) => void
  onRemove: () => void
}) {
  return (
    <div className="group/block relative rounded-md border border-transparent p-2 hover:border-border/40">
      <div className="absolute top-2 right-2 z-10 flex flex-col justify-center gap-1 opacity-0 transition-opacity group-hover/block:opacity-100">
        <ConfirmDelete
          title="Delete this block?"
          description="The content in this block will be removed."
          onConfirm={onRemove}
          trigger={
            <Button
              className="relative z-1 h-8.5 w-8.5 opacity-0 transition-opacity group-hover:opacity-100"
              title="Delete block"
              variant={"ghost"}
            >
              <Trash2 className="text-destructive" />
            </Button>
          }
        />
        <CommentsPopover
          triggerClassName="h-8.5 w-8.5"
          scope={{
            kind: "block",
            sectionId: sectionId,
            containerId: containerId,
            blockId: block.id,
          }}
        />
        <CopyButton
          item={{
            data: block,
            kind: "block",
          }}
          className="h-8.5 w-8.5 opacity-0 transition-opacity group-hover/block:opacity-100"
        />
      </div>
      <div className="pr-2">
        {block.type === "paragraph" && (
          <ParagraphView
            block={block}
            ctx={ctx}
            containerId={containerId}
            sectionId={sectionId}
            allSections={allSections}
            onChange={(fn) => onChange((b) => fn(b as ParagraphBlock) as Block)}
          />
        )}
        {block.type === "list" && (
          <ListBlockView
            block={block}
            allSections={allSections}
            containerId={containerId}
            sectionId={sectionId}
            ctx={ctx}
            onChange={(fn) => onChange((b) => fn(b as ListBlock) as Block)}
          />
        )}
        {block.type === "table" && (
          <TableBlockView
            block={block}
            containerId={containerId}
            sectionId={sectionId}
            onChange={(fn) => onChange((b) => fn(b as TableBlock) as Block)}
          />
        )}
      </div>
    </div>
  )
}
