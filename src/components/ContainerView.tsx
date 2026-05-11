import {
  ChevronRight,
  Copy,
  ListIcon,
  Settings2,
  TableIcon,
  Trash2,
  Type,
} from "lucide-react"
import { Button } from "./ui/button"
import {
  HEADING_SIZE_BY_LEVEL,
  uid,
  type Block,
  type Container,
  type Ctx,
  type HeadingLevelCssString,
  type Section,
} from "@/lib/gamedoc-types"

import { headingId } from "@/lib/utils"
import { KeyValueView } from "./KeyValueView"
import { BlockView } from "./BlockView"
import { ConfirmDelete } from "./ConfirmDelete"
import { RefCopyButton } from "./RefCopyButton"
import { HeadingSelect } from "./heading-select"

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

  return (
    <div
      id={headingId(secId, container.id)}
      className="group relative scroll-mt-22 rounded-lg border border-border/60 p-4"
    >
      <span className="absolute -top-2 bg-background px-3 text-xs text-muted-foreground">
        Container
      </span>
      <div className="mb-3 flex items-center gap-2">
        <HeadingSelect
          value={container.level}
          onChange={(v) => onChange((c) => ({ ...c, level: v }))}
        />
        <HeadingTag
          className={`min-w-0 flex-1 ${HEADING_SIZE_BY_LEVEL[container.level]}`}
        >
          <input
            value={container.title}
            onChange={(e) => onChange((c) => ({ ...c, title: e.target.value }))}
            className="w-full bg-transparent outline-none"
            placeholder="Heading"
          />
        </HeadingTag>
        <RefCopyButton
          sectionId={secId}
          containerId={container.id}
          name={container.title}
        />
        <Button variant="ghost" size="icon" onClick={() => onMove(-1)}>
          <ChevronRight className="h-4 w-4 -rotate-90" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onMove(1)}>
          <ChevronRight className="h-4 w-4 rotate-90" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDuplicate}
          title="Duplicate container"
          className="opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <ConfirmDelete
          title="Delete this container?"
          description={`"${container.title || "Untitled"}" and its contents will be removed.`}
          onConfirm={onRemove}
          trigger={
            <Button
              variant="ghost"
              size="icon"
              title="Delete container"
              className="opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          }
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

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          className="gap-1"
          onClick={() => addBlock({ id: uid(), type: "paragraph", text: "" })}
        >
          <Type className="h-3.5 w-3.5" /> Paragraph
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1"
          onClick={() =>
            addBlock({ id: uid(), type: "list", ordered: false, items: [""] })
          }
        >
          <ListIcon className="h-3.5 w-3.5" /> List
        </Button>
        <Button
          size="sm"
          variant="outline"
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
          <TableIcon className="h-3.5 w-3.5" /> Table
        </Button>
        <Button
          size="sm"
          variant="outline"
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
          <Settings2 className="h-3.5 w-3.5" /> Key-Value Set
        </Button>
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
    </div>
  )
}
