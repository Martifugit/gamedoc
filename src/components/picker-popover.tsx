import { useEffect, useImperativeHandle, useRef, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { ScrollArea } from "./ui/scroll-area"
import type { PickerHandle } from "@/lib/types"

export interface PickerItem<T> {
  id: string
  /** Rendered row — receives isActive so it can show a highlight */
  render: (isActive: boolean) => React.ReactNode
  /** Called when the row is picked (click or Enter) */
  onPick: () => T
}

export interface PickerPopoverProps<T> {
  /** Icon + label shown on the trigger button */
  icon: React.ReactNode

  label: string
  placeholder: string
  /** Called with whatever onPick() returns when the user selects an item */
  onSelect: (value: T) => void
  /** Derive the visible item list from the current query string */
  getItems: (query: string) => PickerItem<T>[]
  emptyMessage?: string
  /** Width of the popover (Tailwind w-* class, default "w-72") */
  width?: string
  title?: string
}

export function PickerPopover<T>({
  icon,
  label,
  placeholder,
  ref,
  onSelect,
  getItems,
  emptyMessage = "No results",
  width = "w-72",
  title,
}: PickerPopoverProps<T> & { ref?: React.Ref<PickerHandle> }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  const items = getItems(q)

  useImperativeHandle(ref, () => ({
    open: () => {
      setOpen(true)
      // Input is not mounted until the popover opens, so defer focus
      setTimeout(() => inputRef?.current?.focus(), 0)
    },
  }))

  // Scroll active item into view
  useEffect(() => {
    itemRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" })
  }, [activeIndex])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, items.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter" && items.length > 0) {
      e.preventDefault()
      pick(items[activeIndex])
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  function pick(item: PickerItem<T>) {
    onSelect(item.onPick())
    setOpen(false)
    setQ("")
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setQ("")
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          title={title}
          className="h-7 gap-1 text-xs"
        >
          {icon} {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className={`${width} p-2`}>
        <Input
          ref={inputRef}
          autoFocus
          placeholder={placeholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={handleKeyDown}
          className="mb-2 h-8"
        />
        <div className="flex max-h-64 min-h-0 overflow-hidden">
          <ScrollArea className="min-h-0 flex-1">
            {items.length === 0 ? (
              <p className="p-2 text-xs text-muted-foreground">
                {emptyMessage}
              </p>
            ) : (
              items.map((item, idx) => (
                <button
                  key={item.id}
                  ref={(el) => {
                    itemRefs.current[idx] = el
                  }}
                  className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent data-[active=true]:bg-accent"
                  data-active={idx === activeIndex}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => pick(item)}
                >
                  {item.render(idx === activeIndex)}
                </button>
              ))
            )}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  )
}
