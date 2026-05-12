// JSONPreview.tsx
import { useState, useCallback } from "react"
import type { GameDoc } from "@/lib/gamedoc-types"
import { Button } from "@/components/ui/button"
import { Check, Copy, Maximize2, Minimize2, Search } from "lucide-react"

interface JSONPreviewProps {
  doc: GameDoc
}

export function JSONPreview({ doc }: JSONPreviewProps) {
  const [expanded, setExpanded] = useState(true)
  const [copied, setCopied] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [highlightIndex, setHighlightIndex] = useState(0)
  const [matches, setMatches] = useState<number[]>([])

  const jsonString = JSON.stringify(doc, null, expanded ? 2 : 0)
  const lineCount = jsonString.split("\n").length

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(jsonString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [jsonString])

  const handleSearch = useCallback(
    (term: string) => {
      setSearchTerm(term)
      if (!term.trim()) {
        setMatches([])
        setHighlightIndex(0)
        return
      }

      const regex = new RegExp(term, "gi")
      const lines = jsonString.split("\n")
      const matchIndices: number[] = []
      lines.forEach((line, idx) => {
        if (regex.test(line)) {
          matchIndices.push(idx)
        }
      })
      setMatches(matchIndices)
      setHighlightIndex(matchIndices.length > 0 ? 0 : -1)
    },
    [jsonString]
  )

  const goToNextMatch = () => {
    if (matches.length === 0) return
    const next = (highlightIndex + 1) % matches.length
    setHighlightIndex(next)
    // Scroll to the line
    const lineElement = document.getElementById(`json-line-${matches[next]}`)
    lineElement?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  const goToPrevMatch = () => {
    if (matches.length === 0) return
    const prev = (highlightIndex - 1 + matches.length) % matches.length
    setHighlightIndex(prev)
    const lineElement = document.getElementById(`json-line-${matches[prev]}`)
    lineElement?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  const highlightText = (text: string, lineIdx: number): React.ReactNode => {
    if (!searchTerm.trim()) return text

    const regex = new RegExp(
      `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    )
    const parts = text.split(regex)
    const isMatchLine = matches.includes(lineIdx)

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark
          key={i}
          className={`bg-yellow-300/70 dark:bg-yellow-500/50 ${
            isMatchLine && highlightIndex === matches.indexOf(lineIdx)
              ? "bg-yellow-400/80 ring-2 ring-yellow-500 dark:bg-yellow-400/70"
              : ""
          }`}
        >
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  const renderJsonLines = () => {
    const lines = jsonString.split("\n")
    return lines.map((line, idx) => {
      let lineClasses =
        "px-4 py-0.5 font-mono text-sm whitespace-pre-wrap break-all"
      if (matches.includes(idx)) {
        lineClasses += " bg-yellow-500/10"
      }
      if (highlightIndex !== -1 && matches[highlightIndex] === idx) {
        lineClasses += " bg-yellow-500/20 ring-1 ring-yellow-500/50"
      }

      return (
        <div key={idx} id={`json-line-${idx}`} className={lineClasses}>
          <span className="mr-4 inline-block w-12 text-right text-xs text-muted-foreground/50 select-none">
            {idx + 1}
          </span>
          <span>{highlightText(line, idx)}</span>
        </div>
      )
    })
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="relative mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
            JSON
          </div>
          <span className="text-xs text-muted-foreground">
            {lineCount} lines · {(jsonString.length / 1024).toFixed(1)} KB
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search in JSON..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="h-8 w-48 rounded-md border border-border bg-background pr-2 pl-7 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
            />
            {matches.length > 0 && searchTerm && (
              <span className="absolute top-1/2 right-2 -translate-y-1/2 text-xs text-muted-foreground">
                {highlightIndex + 1}/{matches.length}
              </span>
            )}
          </div>

          {searchTerm && matches.length > 0 && (
            <div className="flex gap-0.5">
              <button
                onClick={goToPrevMatch}
                className="rounded-l-md border border-border px-2 py-1 text-xs hover:bg-muted"
              >
                ↑
              </button>
              <button
                onClick={goToNextMatch}
                className="rounded-r-md border border-border px-2 py-1 text-xs hover:bg-muted"
              >
                ↓
              </button>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-8 gap-1"
          >
            {expanded ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
            {expanded ? "Compact" : "Pretty"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-8 gap-1"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy
              </>
            )}
          </Button>
        </div>
      </div>

      {/* JSON Content */}
      <div className="relative flex-1 overflow-auto rounded-lg border border-border bg-muted/30">
        <pre className="min-h-[400px] overflow-x-auto p-0 font-mono text-sm">
          <code>{renderJsonLines()}</code>
        </pre>
      </div>

      {/* Footer stats */}
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <div>
          {matches.length > 0 && searchTerm && (
            <span>
              Found {matches.length} occurrence{matches.length !== 1 && "s"}
            </span>
          )}
        </div>
        <div className="font-mono">
          {doc.sections.length} section{doc.sections.length !== 1 && "s"}
        </div>
      </div>
    </div>
  )
}
