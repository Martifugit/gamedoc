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

export function BlockView({
  block,
  ctx,
  allSections,
  onChange,
  onRemove,
}: {
  block: Block
  ctx: Ctx
  allSections: Section[]
  onChange: (fn: (b: Block) => Block) => void
  onRemove: () => void
}) {
  return (
    <div className="group/block relative rounded-md border border-transparent p-2 hover:border-border/40">
      <div className="absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover/block:opacity-100">
        <ConfirmDelete
          title="Delete this block?"
          description="The content in this block will be removed."
          onConfirm={onRemove}
          trigger={
            <Button
              className="relative z-1 opacity-0 transition-opacity group-hover:opacity-100"
              title="Delete block"
              variant={"ghost"}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          }
        />
      </div>
      <div className="pr-12">
        {block.type === "paragraph" && (
          <ParagraphView
            block={block}
            ctx={ctx}
            allSections={allSections}
            onChange={(fn) => onChange((b) => fn(b as ParagraphBlock) as Block)}
          />
        )}
        {block.type === "list" && (
          <ListBlockView
            block={block}
            allSections={allSections}
            ctx={ctx}
            onChange={(fn) => onChange((b) => fn(b as ListBlock) as Block)}
          />
        )}
        {block.type === "table" && (
          <TableBlockView
            block={block}
            onChange={(fn) => onChange((b) => fn(b as TableBlock) as Block)}
          />
        )}
      </div>
    </div>
  )
}
