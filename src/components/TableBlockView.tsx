import { useEffect, useRef, useState } from "react"
import type { TableBlock } from "@/lib/gamedoc-types"
import { useDebounce } from "@/hooks/use-debounce"
import { Plus, X } from "lucide-react"
import { Button } from "./ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table"
import { blockId, cn } from "@/lib/utils"
import { useScopeHighlight } from "@/hooks/use-scope-highlight"

export function TableBlockView({
  block,
  containerId,
  sectionId,
  onChange,
}: {
  block: TableBlock
  containerId: string
  sectionId: string
  onChange: (fn: (b: TableBlock) => TableBlock) => void
}) {
  const [localBlock, setLocalBlock] = useState<TableBlock>(block)
  const debouncedBlock = useDebounce(localBlock, 300)

  const onChangeRef = useRef(onChange)

  const { highlight: highlightComment } = useScopeHighlight(
    {
      kind: "block",
      blockId: block.id,
      containerId,
      sectionId,
    },
    2000
  )

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    onChangeRef.current(() => debouncedBlock)
  }, [debouncedBlock])

  const updateLocal = (fn: (b: TableBlock) => TableBlock) =>
    setLocalBlock((prev) => fn(prev))

  const setCell = (r: number, c: number, val: string) =>
    updateLocal((b) => ({
      ...b,
      rows: b.rows.map((row, i) =>
        i === r ? row.map((cell, j) => (j === c ? val : cell)) : row
      ),
    }))

  const removeColumn = (colIndex: number) =>
    updateLocal((b) => ({
      ...b,
      headers: b.headers.filter((_, i) => i !== colIndex),
      rows: b.rows.map((row) => row.filter((_, i) => i !== colIndex)),
    }))

  return (
    <div
      id={blockId(block.id)}
      className={cn(
        "scroll-mt-22 space-y-2 rounded-md ring-1 ring-transparent",
        highlightComment && "ring-blue-500"
      )}
    >
      {/* Horizontally scrollable container with invisible scrollbar */}
      <div className="scrollbar-hidden overflow-x-auto rounded-md border">
        <Table scrollbarHidden className="min-w-max">
          <TableHeader>
            <TableRow>
              {localBlock.headers.map((h, i) => (
                <TableHead
                  key={i}
                  className="group relative bg-muted/15 p-1 not-last:border-r"
                >
                  <div className="flex items-center gap-1">
                    <input
                      value={h}
                      onChange={(e) =>
                        updateLocal((b) => ({
                          ...b,
                          headers: b.headers.map((x, j) =>
                            j === i ? e.target.value : x
                          ),
                        }))
                      }
                      className="w-full min-w-20 rounded border border-transparent bg-transparent p-1 font-medium outline-none focus-visible:border-border"
                    />
                  </div>
                </TableHead>
              ))}

              {/* Add column */}
              <TableHead className="sticky right-0 bg-background p-0 px-2 after:absolute after:inset-0 after:bg-muted/15">
                <button
                  className="h-full w-full text-muted-foreground hover:text-destructive"
                  onClick={() => removeColumn(localBlock.headers.length - 1)}
                  title="Remove column"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {localBlock.rows.map((row, r) => (
              <TableRow key={r} className="even:bg-muted/10">
                {row.map((cell, c) => (
                  <TableCell key={c} className="p-1 not-last:border-r">
                    <input
                      value={cell}
                      onChange={(e) => setCell(r, c, e.target.value)}
                      className="w-full min-w-20 rounded border border-transparent bg-transparent p-1 outline-none focus-visible:border-border"
                    />
                  </TableCell>
                ))}
                {/* Delete row — disabled for the last remaining row */}
                <TableCell className="sticky right-0 bg-background p-0 px-2">
                  <button
                    className="text-muted-foreground hover:text-destructive disabled:cursor-not-allowed disabled:opacity-30"
                    disabled={localBlock.rows.length === 1}
                    onClick={() =>
                      updateLocal((b) => ({
                        ...b,
                        rows: b.rows.filter((_, i) => i !== r),
                      }))
                    }
                    title="Delete row"
                  >
                    <X className="mx-auto h-3.5 w-3.5" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Button
        size="sm"
        className="mr-2"
        variant="ghost"
        onClick={() =>
          updateLocal((b) => ({
            ...b,
            headers: [...b.headers, `Column ${b.headers.length + 1}`],
            rows: b.rows.map((r) => [...r, ""]),
          }))
        }
        title="Add column"
      >
        <Plus className="mx-auto h-4 w-4" /> Add Col
      </Button>
      <Button
        size="sm"
        variant="ghost"
        title="Add Row"
        onClick={() =>
          updateLocal((b) => ({
            ...b,
            rows: [...b.rows, b.headers.map(() => "")],
          }))
        }
      >
        <Plus className="h-3.5 w-3.5" /> Add Row
      </Button>
    </div>
  )
}
