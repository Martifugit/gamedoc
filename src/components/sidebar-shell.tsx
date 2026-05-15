import { SidebarClose, Search, SidebarOpen } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { ScrollArea } from "./ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet"

/** Returns true when the viewport is below the md breakpoint (768px). */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia("(max-width: 767px)").matches
  )
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])
  return isMobile
}

interface SidebarShellProps {
  /** Which side this sidebar lives on */
  side: "left" | "right"
  /** Label shown in the header, e.g. "Sections (3)" */
  title: string
  /** Keyboard shortcut key (shown in the toggle button title) */
  shortcutLabel: string
  /** Search placeholder */
  searchPlaceholder: string
  /** Search query value */
  searchQuery: string
  onSearchChange: (q: string) => void
  onOpenChange?: (open: boolean) => void
  /** Whether the search input should be disabled */
  searchDisabled?: boolean
  /** The scrollable content rendered inside the shell */
  children: React.ReactNode
  /** Optional className for the aside wrapper */
  className?: string
}

/**
 * Shared shell for both the Table-of-Contents and Variables sidebars.
 *
 * – On desktop (≥768 px): renders as a collapsible <aside> that expands
 *   horizontally, just like the original components.
 * – On mobile (<768 px): renders as a collapsed strip; tapping it opens a
 *   bottom/side Sheet instead of trying to expand inside the layout.
 */
export function SidebarShell({
  side,
  title,
  shortcutLabel,
  searchPlaceholder,
  searchQuery,
  onSearchChange,
  onOpenChange,
  searchDisabled = false,
  children,
  className,
}: SidebarShellProps) {
  const [open, setOpen] = useState(false)
  const [closedAndSettled, setClosedAndSettled] = useState(true)

  const isMobile = useIsMobile()

  // Keyboard shortcut — same logic the original components used
  useEffect(() => {
    const parts = shortcutLabel
      .toLowerCase()
      .replace(/[()]/g, "")
      .trim()
      .split("+")
      .map((p) => p.trim())

    const modifiers = {
      ctrl: parts.includes("ctrl"),
      meta: parts.includes("meta"),
      alt: parts.includes("alt"),
      shift: parts.includes("shift"),
    }
    const key = parts.find((p) => !["ctrl", "meta", "alt", "shift"].includes(p))

    if (!key) return

    const handleKeydown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() !== key ||
        e.ctrlKey !== modifiers.ctrl ||
        e.metaKey !== modifiers.meta ||
        e.altKey !== modifiers.alt ||
        e.shiftKey !== modifiers.shift
      )
        return

      e.preventDefault()
      e.stopPropagation()
      setOpen((prev) => !prev)
    }

    window.addEventListener("keydown", handleKeydown, true)
    return () => window.removeEventListener("keydown", handleKeydown, true)
  }, [shortcutLabel])

  const onOpenChangeRef = useRef(onOpenChange)
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange
  }, [onOpenChange])

  useEffect(() => {
    onOpenChangeRef.current?.(open)
  }, [open])

  // ── Mobile: collapsed strip → Sheet ─────────────────────────────────────
  if (isMobile) {
    return (
      <>
        <Button
          size="icon-sm"
          variant={"outline"}
          className={cn(
            "fixed z-40",
            side === "left" ? "top-8 left-4" : "top-8 right-4"
          )}
          title={`Open Sidebar`}
          onClick={() => {
            setOpen(true)
          }}
        >
          <SidebarOpen className={side === "right" ? "rotate-180" : ""} />
        </Button>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side={side === "left" ? "left" : "right"}
            className="flex flex-col gap-4 bg-background/80 px-4 py-6 backdrop-blur-lg"
          >
            <SheetDescription className="sr-only">Sidebar</SheetDescription>
            <SheetHeader className="px-0">
              <SheetTitle className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {title}
              </SheetTitle>
            </SheetHeader>

            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                disabled={searchDisabled}
                onChange={(e) => onSearchChange(e.target.value)}
                className="rounded-md bg-transparent! pl-8"
              />
            </div>

            {/* Content */}
            <div className="flex min-h-0 flex-1 overflow-hidden text-sm">
              <ScrollArea className="max-h-[calc(100dvh-10rem)] min-h-0 w-full pr-3">
                {children}
              </ScrollArea>
            </div>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  // ── Desktop: collapsible aside ───────────────────────────────────────────
  return (
    <aside
      className={cn(
        "group relative min-h-screen shrink-0 border-border/50 p-3 transition-[width] duration-200",
        side === "left" ? "border-r" : "border-l",
        open ? "w-72" : "w-12 bg-muted/5",
        !open && closedAndSettled && "hover:bg-muted/10",
        className
      )}
      onTransitionEnd={() => {
        if (!open) setClosedAndSettled(true)
      }}
      title={!open ? `Open Sidebar (${shortcutLabel})` : undefined}
      onClick={() => {
        if (open) return
        setOpen(true)
      }}
    >
      {!open && closedAndSettled && (
        <div
          className={cn(
            "icon pointer-events-none sticky top-8 h-0 w-full opacity-0 transition-opacity group-hover:opacity-100"
          )}
        >
          <div className="absolute left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center">
            <SidebarOpen
              className={cn("shrink-0", side === "right" && "rotate-180")}
              size={24}
            />
          </div>
        </div>
      )}

      <div className="sticky top-8 flex h-screen min-h-0 flex-col gap-4 overflow-hidden">
        {/* Header */}
        <div
          className={cn(
            "flex flex-nowrap items-center transition-opacity",
            side === "left"
              ? "justify-between"
              : "flex-row-reverse justify-between",
            open
              ? "opacity-100 delay-200"
              : "pointer-events-none opacity-0 delay-0"
          )}
        >
          {side === "left" ? (
            <>
              <p className="text-xs font-semibold tracking-wide text-nowrap text-muted-foreground uppercase">
                {title}
              </p>
              <Button
                title={`(${shortcutLabel})`}
                onClick={() => {
                  setOpen(false)
                  setClosedAndSettled(false)
                }}
                variant="ghost"
                size="icon"
              >
                <SidebarClose className="rotate-0" />
              </Button>
            </>
          ) : (
            <>
              <Button
                title={`(${shortcutLabel})`}
                onClick={() => {
                  setOpen(false)
                  setClosedAndSettled(false)
                }}
                variant="ghost"
                size="icon"
              >
                <SidebarClose className="rotate-180" />
              </Button>
              <p className="text-xs font-semibold tracking-wide text-nowrap text-muted-foreground uppercase">
                {title}
              </p>
            </>
          )}
        </div>

        {/* Search */}
        <div
          className={cn(
            "relative transition-opacity",
            open ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            disabled={searchDisabled}
            onChange={(e) => onSearchChange(e.target.value)}
            className="rounded-md bg-transparent! pl-8"
          />
        </div>

        {/* Content */}
        <div
          className={cn(
            "flex min-h-0 flex-1 overflow-hidden text-sm transition-opacity",
            open ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          <ScrollArea className="max-h-[calc(100vh-9rem)] min-h-0 w-full pr-3">
            {children}
          </ScrollArea>
        </div>
      </div>
    </aside>
  )
}
