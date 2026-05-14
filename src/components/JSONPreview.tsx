// JSONPreview.tsx
import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import type { GameDoc } from "@/lib/gamedoc-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clipboard,
  Maximize2,
  Minimize2,
  Search,
} from "lucide-react"
import { createHighlighter, type Highlighter, type ThemedToken } from "shiki"

interface JSONPreviewProps {
  doc: GameDoc
}

// ────────────────────────────────────────────────────────────────────────────
// Shiki singleton.
// createHighlighter() is expensive (loads grammar + theme WASM); we share one
// instance across every mount of this component for the page lifetime.
// ────────────────────────────────────────────────────────────────────────────

let highlighterPromise: Promise<Highlighter> | null = null

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-light"],
      langs: ["json"],
    })
  }
  return highlighterPromise
}

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

interface SearchMatch {
  lineIdx: number
  start: number
  end: number
}

// ────────────────────────────────────────────────────────────────────────────
// Search helpers
// ────────────────────────────────────────────────────────────────────────────

function findMatches(lines: string[], term: string): SearchMatch[] {
  if (!term.trim()) return []
  const needle = term.toLowerCase()
  const out: SearchMatch[] = []
  lines.forEach((line, lineIdx) => {
    const hay = line.toLowerCase()
    let from = 0
    while (true) {
      const idx = hay.indexOf(needle, from)
      if (idx === -1) break
      out.push({ lineIdx, start: idx, end: idx + needle.length })
      from = idx + needle.length
    }
  })
  return out
}

/**
 * Walk Shiki's tokens for a single line and emit React nodes, splitting any
 * token whose character range intersects a search match so we can wrap the
 * matched slice in a <mark>. Tokens keep their syntax-highlight color; the
 * mark only paints a background.
 */
function renderTokensWithMatches(
  tokens: ThemedToken[],
  lineIdx: number,
  matches: SearchMatch[],
  activeMatchKey: string | null
): React.ReactNode[] {
  const lineMatches = matches.filter((m) => m.lineIdx === lineIdx)
  const nodes: React.ReactNode[] = []
  let col = 0 // character offset within the line

  tokens.forEach((token, tIdx) => {
    const tokenStart = col
    const tokenEnd = col + token.content.length
    const style: React.CSSProperties = {
      color: token.color,
      ...(token.fontStyle === 1 && { fontStyle: "italic" }),
      ...(token.fontStyle === 2 && { fontWeight: "bold" }),
    }

    // Find matches overlapping this token.
    const overlapping = lineMatches.filter(
      (m) => m.start < tokenEnd && m.end > tokenStart
    )

    if (overlapping.length === 0) {
      nodes.push(
        <span key={tIdx} style={style}>
          {token.content}
        </span>
      )
      col = tokenEnd
      return
    }

    // Walk through the token, slicing at every match boundary.
    let cursor = tokenStart
    let pieceIdx = 0
    overlapping.forEach((m) => {
      const overlapStart = Math.max(m.start, tokenStart)
      const overlapEnd = Math.min(m.end, tokenEnd)

      // Unmarked slice before this match.
      if (overlapStart > cursor) {
        nodes.push(
          <span key={`${tIdx}-${pieceIdx++}`} style={style}>
            {token.content.slice(
              cursor - tokenStart,
              overlapStart - tokenStart
            )}
          </span>
        )
      }

      const matchKey = `${m.lineIdx}:${m.start}`
      const isActive = matchKey === activeMatchKey
      nodes.push(
        <mark
          key={`${tIdx}-${pieceIdx++}-m`}
          data-match-key={matchKey}
          className={cn(
            "rounded-xs",
            isActive ? "bg-primary/10 ring-1 ring-primary/20" : "bg-primary/8"
          )}
          style={{ color: token.color, backgroundColor: undefined }}
        >
          {token.content.slice(
            overlapStart - tokenStart,
            overlapEnd - tokenStart
          )}
        </mark>
      )
      cursor = overlapEnd
    })

    // Unmarked tail.
    if (cursor < tokenEnd) {
      nodes.push(
        <span key={`${tIdx}-tail`} style={style}>
          {token.content.slice(cursor - tokenStart)}
        </span>
      )
    }

    col = tokenEnd
  })

  return nodes
}

// ────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────

export function JSONPreview({ doc }: JSONPreviewProps) {
  const [compact, setCompact] = useState(false)
  const [copied, setCopied] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeMatch, setActiveMatch] = useState(0)
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null)

  const searchRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Load (or reuse) Shiki on mount.
  useEffect(() => {
    let cancelled = false
    getHighlighter().then((h) => {
      if (!cancelled) setHighlighter(h)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const jsonString = useMemo(
    () => JSON.stringify(doc, null, compact ? 0 : 2),
    [doc, compact]
  )

  const lines = useMemo(() => jsonString.split("\n"), [jsonString])

  const sizeKb = useMemo(
    () => (new TextEncoder().encode(jsonString).byteLength / 1024).toFixed(1),
    [jsonString]
  )

  // Tokenize once per (jsonString, highlighter) pair.
  const tokenizedLines = useMemo<ThemedToken[][] | null>(() => {
    if (!highlighter) return null
    const { tokens } = highlighter.codeToTokens(jsonString, {
      lang: "json",
      theme: "github-light",
    })
    return tokens
  }, [jsonString, highlighter])

  const searchMatches = useMemo(
    () => findMatches(lines, searchTerm),
    [lines, searchTerm]
  )

  // Scroll the active match into view.
  useEffect(() => {
    if (!searchMatches.length) return
    const m = searchMatches[activeMatch]
    if (!m) return
    document
      .getElementById(`jl-${m.lineIdx}`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [activeMatch, searchMatches])

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(jsonString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [jsonString])

  const cycleMatch = useCallback(
    (dir: 1 | -1) => {
      if (!searchMatches.length) return
      setActiveMatch(
        (prev) => (prev + dir + searchMatches.length) % searchMatches.length
      )
    },
    [searchMatches.length]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      cycleMatch(e.shiftKey ? -1 : 1)
    } else if (e.key === "Escape") {
      setSearchTerm("")
      searchRef.current?.blur()
    }
  }

  const activeMatchKey = useMemo(() => {
    const m = searchMatches[activeMatch]
    return m ? `${m.lineIdx}:${m.start}` : null
  }, [activeMatch, searchMatches])

  const matchedLineSet = useMemo(() => {
    const s = new Set<number>()
    for (const m of searchMatches) s.add(m.lineIdx)
    return s
  }, [searchMatches])

  const hasMatches = searchMatches.length > 0
  const noMatches = searchTerm.trim() !== "" && searchMatches.length === 0
  const activeLineIdx = searchMatches[activeMatch]?.lineIdx ?? -1

  // ──────────────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div
      ref={scrollRef}
      className="relative max-h-[70vh] overflow-auto rounded-lg border border-border bg-background font-mono"
    >
      {/* ─── Sticky toolbar ─── */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-border bg-background/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        {/* Meta (left) */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] font-medium tracking-wider text-muted-foreground">
            JSON
          </span>
          <span className="truncate font-mono text-xs text-muted-foreground/70">
            {lines.length} lines · {sizeKb} KB · {doc.sections.length} section
            {doc.sections.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Controls (right) */}
        <div className="flex items-center gap-1.5">
          {/* Search */}
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-2 size-3.5 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Find in JSON…"
              className={cn(
                "h-7 w-44 pl-7 font-mono text-xs",
                hasMatches && "pr-14",
                noMatches && "pr-[4.5rem]"
              )}
            />
            {searchTerm && (
              <span
                className={cn(
                  "pointer-events-none absolute right-2 font-mono text-[11px]",
                  noMatches ? "text-destructive" : "text-muted-foreground"
                )}
              >
                {noMatches
                  ? "no match"
                  : `${activeMatch + 1}/${searchMatches.length}`}
              </span>
            )}
          </div>

          {/* Prev / Next */}
          {hasMatches && (
            <div className="flex">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => cycleMatch(-1)}
                title="Previous match (Shift+Enter)"
                className="rounded-r-none"
              >
                <ChevronUp />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => cycleMatch(1)}
                title="Next match (Enter)"
                className="rounded-l-none border-l-0"
              >
                <ChevronDown />
              </Button>
            </div>
          )}

          {/* Compact / Pretty */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCompact((c) => !c)}
            title={compact ? "Switch to pretty print" : "Switch to compact"}
          >
            {compact ? <Maximize2 /> : <Minimize2 />}
            {compact ? "Pretty" : "Compact"}
          </Button>

          {/* Copy */}
          <Button
            variant={copied ? "secondary" : "outline"}
            size="sm"
            onClick={handleCopy}
            title="Copy JSON to clipboard"
          >
            {copied ? <Check /> : <Clipboard />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>

      {/* ─── Code body ─── */}
      <div className="py-2">
        {!tokenizedLines ? (
          // Loading state — render plain text so the user sees content immediately.
          <div className="space-y-0.5 px-4 py-2 font-mono text-[13px] leading-5 text-muted-foreground/70">
            {lines.slice(0, 40).map((line, i) => (
              <div key={i} className="whitespace-pre">
                {line}
              </div>
            ))}
            {lines.length > 40 && <div>…</div>}
          </div>
        ) : (
          tokenizedLines.map((tokens, lineIdx) => {
            const matched = matchedLineSet.has(lineIdx)
            const active = lineIdx === activeLineIdx
            return (
              <div
                key={lineIdx}
                id={`jl-${lineIdx}`}
                className={cn(
                  "flex items-baseline transition-colors duration-100",
                  active
                    ? "bg-blue-500/[0.10]"
                    : matched
                      ? "bg-blue-500/[0.04]"
                      : "bg-transparent"
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "min-w-[52px] shrink-0 pr-5 pl-3 text-right font-mono text-[11px] leading-5 tabular-nums transition-opacity duration-100 select-none",
                    matched
                      ? "text-muted-foreground opacity-100"
                      : "text-muted-foreground/40"
                  )}
                >
                  {lineIdx + 1}
                </span>
                <span className="flex-1 pr-5 font-mono text-[13px] leading-5 break-all whitespace-pre-wrap">
                  {tokens.length === 0
                    ? "\u00A0" /* keep empty lines visible */
                    : renderTokensWithMatches(
                        tokens,
                        lineIdx,
                        searchMatches,
                        activeMatchKey
                      )}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
