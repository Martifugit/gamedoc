import type { Ctx, ListBlock, Section } from "@/lib/gamedoc-types"
import { Button } from "./ui/button"
import { ListIcon, ListOrdered } from "lucide-react"
import { useState, useRef, useEffect, memo, useCallback } from "react"
import { InsertLinkButton } from "./InsertLinkButton"
import { ReferencePicker } from "./ReferencePicker"
import { VariablePicker } from "./VariablePicker"
import { flushSync } from "react-dom"
import { HeadingSelect } from "./heading-select"
import { Input } from "./ui/input"
import { RenderInline } from "./RenderInline"

export function ListBlockView({
  block,
  ctx,
  allSections,
  onChange,
}: {
  block: ListBlock
  ctx: Ctx
  allSections: Section[]
  onChange: (fn: (b: ListBlock) => ListBlock) => void
}) {
  const [localHeading, setLocalHeading] = useState(block.heading ?? "")
  const [localItems, setLocalItems] = useState(block.items)
  const [showPreview, setShowPreview] = useState(false)
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Focus the active input when it changes
  useEffect(() => {
    if (activeItemIndex !== null && inputRefs.current[activeItemIndex]) {
      inputRefs.current[activeItemIndex]?.focus()
    }
  }, [activeItemIndex])

  const insertIntoActiveItem = (snippet: string) => {
    if (activeItemIndex === null) return
    const input = inputRefs.current[activeItemIndex]
    if (!input) return

    const start = input.selectionStart ?? input.value.length
    const end = input.selectionEnd ?? input.value.length
    const nextText =
      input.value.slice(0, start) + snippet + input.value.slice(end)

    flushSync(() => {
      const next = localItems.map((item, i) =>
        i === activeItemIndex ? nextText : item
      )
      setLocalItems(next)
      onChange((b) => ({ ...b, items: next }))
    })

    input.focus()
    input.setSelectionRange(start + snippet.length, start + snippet.length)
  }

  const updateItem = useCallback((index: number, value: string) => {
    setLocalItems((prev) => prev.map((x, i) => (i === index ? value : x)))
  }, [])

  const handleListBlur = (e: React.FocusEvent<HTMLUListElement>) => {
    if (e.currentTarget.contains(e.relatedTarget)) return
    onChange((b) => ({ ...b, items: localItems }))
  }

  const handleFocus = useCallback((index: number) => {
    setActiveItemIndex(index)
  }, [])

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
    currentValue: string
  ) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const next = [
        ...localItems.slice(0, index + 1),
        "",
        ...localItems.slice(index + 1),
      ]
      flushSync(() => {
        setLocalItems(next)
        onChange((b) => ({ ...b, items: next }))
      })
      inputRefs.current[index + 1]?.focus()
    } else if (
      e.key === "Backspace" &&
      currentValue === "" &&
      localItems.length > 1
    ) {
      e.preventDefault()
      const target = index > 0 ? index - 1 : 0
      const next = localItems.filter((_, j) => j !== index)
      flushSync(() => {
        setLocalItems(next)
        onChange((b) => ({ ...b, items: next }))
      })
      inputRefs.current[target]?.focus()
      setActiveItemIndex(target)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 pr-12">
        <HeadingSelect
          value={block.headingLevel ?? 5}
          onChange={(v) =>
            onChange((b) => ({
              ...b,
              headingLevel: v,
            }))
          }
        />
        <Input
          placeholder="Optional Heading..."
          className="rounded-md bg-transparent!"
          value={localHeading}
          onBlur={() =>
            onChange((b) => ({
              ...b,
              heading: localHeading,
            }))
          }
          onChange={(e) => setLocalHeading(e.currentTarget.value)}
        />
      </div>
      <ul
        onBlur={handleListBlur}
        className={`space-y-1 pl-5 ${block.ordered ? "list-decimal" : "list-disc"}`}
      >
        {localItems.map((item, i) => (
          <li
            key={`item-editable-${i}`}
            className="grid grid-cols-[24px_1fr] leading-relaxed"
          >
            <span className="mr-2">{!block.ordered ? "•" : `${i + 1}.`}</span>
            <ListItem
              value={item}
              index={i}
              onUpdate={updateItem}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
              inputRef={(el) => {
                inputRefs.current[i] = el
              }}
            />
          </li>
        ))}
      </ul>

      {showPreview && (
        <div className="rounded-md bg-input/20 p-2 text-sm text-muted-foreground">
          {localItems.map((item, i) => (
            <div
              key={`item-preview-${i}`}
              className="grid grid-cols-[20px_1fr]"
            >
              <span>{!block.ordered ? "•" : `${i + 1}.`}</span>
              <RenderInline text={item} ctx={ctx} />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 text-xs"
            onClick={() => onChange((b) => ({ ...b, ordered: !b.ordered }))}
          >
            {block.ordered ? (
              <ListOrdered className="h-3 w-3" />
            ) : (
              <ListIcon className="h-3 w-3" />
            )}
            {block.ordered ? "Ordered" : "Bulleted"}
          </Button>

          {/* Only show insertion tools when an item is focused */}
          {activeItemIndex !== null && (
            <div className="flex items-center gap-2">
              <InsertLinkButton onInsert={insertIntoActiveItem} />
              <ReferencePicker
                allSections={allSections}
                onPick={(ref) => insertIntoActiveItem(ref)}
              />
              <VariablePicker
                allSections={allSections}
                onPick={(id) => insertIntoActiveItem(`{{var:${id}}}`)}
              />
            </div>
          )}
        </div>

        <Button
          onClick={() => setShowPreview(!showPreview)}
          size={"sm"}
          variant="ghost"
          className={showPreview ? "bg-muted hover:bg-muted/90" : ""}
        >
          {showPreview ? <>Hide Preview</> : <>Show preview</>}
        </Button>
      </div>
    </div>
  )
}

const ListItem = memo(function ListItem({
  value,
  index,
  onUpdate, // flush this item's text up to ListBlockView's localItems
  onFocus,
  onKeyDown,
  inputRef,
}: {
  value: string
  index: number
  onUpdate: (index: number, value: string) => void
  onFocus: (index: number) => void
  onKeyDown: (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
    currentValue: string
  ) => void
  inputRef: (el: HTMLInputElement | null) => void
}) {
  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => onUpdate(index, e.target.value)}
      onFocus={() => onFocus(index)}
      onKeyDown={(e) => onKeyDown(e, index, value)}
      className="flex-1 bg-transparent outline-none"
      placeholder="Item"
    />
  )
})
