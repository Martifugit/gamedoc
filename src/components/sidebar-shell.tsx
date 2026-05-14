import { SidebarClose, Search, SidebarOpen } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { ScrollArea } from "./ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet"

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
  searchDisabled = false,
  children,
  className,
}: SidebarShellProps) {
  const [open, setOpen] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const isMobile = useIsMobile()

  // Keyboard shortcut — same logic the original components used
  useEffect(() => {
    const key = shortcutLabel.replace(/[()]/g, "").trim()
    const useCtrl = key.startsWith("ctrl+")
    const actualKey = useCtrl ? key.replace("ctrl+", "") : key

    const handleKeydown = (e: KeyboardEvent) => {
      const ctrlMatch = useCtrl
        ? e.ctrlKey
        : !e.ctrlKey && !e.altKey && !e.metaKey
      if (e.key === actualKey && ctrlMatch) {
        e.preventDefault()
        e.stopPropagation()
        setOpen((p) => !p)
      }
    }

    window.addEventListener("keydown", handleKeydown, true)
    return () => window.removeEventListener("keydown", handleKeydown, true)
  }, [shortcutLabel])

  useEffect(() => {
    const timeoutHandle = setTimeout(() => {
      setIsTransitioning(true)
    }, 500)

    return () => clearTimeout(timeoutHandle)
  }, [open])

  // ── Mobile: collapsed strip → Sheet ─────────────────────────────────────
  if (isMobile) {
    return (
      <>
        {/* Thin strip that acts as a tap target */}
        <aside
          className={cn(
            "relative min-h-screen w-10 shrink-0 cursor-pointer border-border/50 hover:bg-primary/20",
            side === "left" ? "border-r" : "border-l",
            className
          )}
          title={`Open ${title}`}
          onClick={() => setOpen(true)}
        >
          {/* Rotated label so the strip isn't completely empty */}
          <span
            className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 text-[10px] font-semibold tracking-widest whitespace-nowrap text-muted-foreground/50 uppercase select-none"
            )}
          >
            {title}
          </span>
        </aside>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side={side === "left" ? "left" : "right"}
            className="flex w-80 flex-col gap-4 px-4 py-6"
          >
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
        "group relative min-h-screen shrink-0 border-border/50 px-4 py-6 transition-[width]",
        side === "left" ? "border-r" : "border-l",
        open ? "w-72" : "w-12 hover:bg-primary/3",
        className
      )}
      title={!open ? `Open ${title}` : undefined}
      onClick={() => {
        if (open) return
        setOpen(true)
        setIsTransitioning(true)
      }}
    >
      {!open && !isTransitioning && (
        <div className="icon pointer-events-none sticky inset-x-0 top-8 left-1/2 h-0 w-full -translate-x-1/2 opacity-0 transition-opacity delay-600 group-hover:opacity-100">
          <div className="absolute inset-x-0 flex h-8 w-8 items-center justify-center">
            <SidebarOpen
              className={cn("shrink-0", side === "right" && "rotate-180")}
              size={24}
            />
          </div>
        </div>
      )}

      <div className="sticky top-8 flex h-screen min-h-0 flex-col gap-4">
        {/* Header */}
        <div
          className={cn(
            "flex flex-nowrap items-center transition-opacity",
            side === "left"
              ? "justify-between"
              : "flex-row-reverse justify-between",
            open ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          {side === "left" ? (
            <>
              <p className="text-xs font-semibold tracking-wide text-nowrap text-muted-foreground uppercase">
                {title}
              </p>
              <Button
                title={`(${shortcutLabel})`}
                onClick={() => setOpen(false)}
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
                onClick={() => setOpen(false)}
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
