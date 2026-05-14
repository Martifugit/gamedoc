import { Button } from "./ui/button"
import { cn } from "@/lib/utils"

export function ButtonGroup({
  className,
  contents,
  size = "icon-lg",
}: {
  className?: string
  size?: "icon" | "icon-lg"
  contents: {
    slot: React.ReactNode
    title?: string
    disabled?: boolean
    selected?: boolean
    onClick: () => void
  }[]
}) {
  if (contents.length < 2) return null

  const cls = {
    first: "rounded-r-none! border-r-0",
    middle: "rounded-none! border-r-0",
    last: "rounded-l-none!",
  }

  return (
    <div className={cn(className, "flex items-center")}>
      {contents.map((content, idx) => {
        let resolvedClass: string = ""

        const isLast = idx === contents.length - 1

        if (idx === 0) {
          resolvedClass = cls.first
        } else if (isLast) {
          resolvedClass = cls.last
        } else {
          resolvedClass = cls.middle
        }

        return (
          <Button
            key={`bgrp-${idx}`}
            size={size}
            variant="outline"
            disabled={content.disabled}
            onClick={content.onClick}
            className={cn(
              "rounded-sm",
              resolvedClass,
              content.selected && "rounded-sm bg-accent!"
            )}
            title={content.title}
          >
            {content.slot}
          </Button>
        )
      })}
    </div>
  )
}
