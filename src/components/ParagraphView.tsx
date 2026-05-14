import type { Ctx, ParagraphBlock, Section } from "@/lib/gamedoc-types"
import { useRef, useState } from "react"
import { Textarea } from "./ui/textarea"
import { InsertLinkPopover } from "./InsertLinkPopover"
import { ReferencePicker } from "./ReferencePicker"
import { VariablePicker } from "./VariablePicker"
import { Button } from "./ui/button"
import { flushSync } from "react-dom"
import { formatVariableReference } from "@/lib/reference-syntax"
import { RenderInline } from "./RenderInline"
import { useEditorInput } from "@/hooks/use-editable-input"

export function ParagraphView({
  block,
  ctx,
  allSections,
  onChange,
}: {
  block: ParagraphBlock
  ctx: Ctx
  allSections: Section[]
  onChange: (fn: (b: ParagraphBlock) => ParagraphBlock) => void
}) {
  const [showPreview, setShowPreview] = useState(false)
  const [localText, setLocalText] = useState(block.text)
  const taRef = useRef<HTMLTextAreaElement>(null)

  const ref = useEditorInput<HTMLTextAreaElement>()

  const insert = (snippet: string) => {
    const ta = taRef.current
    if (!ta) return
    const start = ta.selectionStart ?? block.text.length
    const end = ta.selectionEnd ?? block.text.length
    const next = block.text.slice(0, start) + snippet + block.text.slice(end)
    flushSync(() => {
      onChange((b) => ({ ...b, text: next }))
      setLocalText(next)
    })
    ta.focus()
    ta.setSelectionRange(start + snippet.length, start + snippet.length)
  }

  return (
    <div className="space-y-2 pr-8 md:pr-12">
      <Textarea
        // ref={taRef}
        ref={ref}
        value={localText}
        onChange={(e) => setLocalText(e.currentTarget.value)}
        onBlur={() => onChange((b) => ({ ...b, text: localText }))}
        placeholder="Write a paragraph…"
        className="min-h-18 resize-none border-transparent bg-transparent text-sm leading-relaxed text-muted-foreground focus-visible:border-border focus-visible:ring-0 md:text-base"
      />
      <div className="flex items-start justify-between gap-2 md:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <InsertLinkPopover onInsert={insert} />
          <ReferencePicker
            allSections={allSections}
            onPick={(ref) => insert(ref)}
          />
          <VariablePicker
            allSections={allSections}
            onPick={(id, name) => insert(formatVariableReference(id, name))}
          />
        </div>
        <Button
          onClick={() => setShowPreview(!showPreview)}
          size={"sm"}
          variant="ghost"
          disabled={localText.trim() === ""}
          className={showPreview ? "bg-muted hover:bg-muted/90" : ""}
          title={`${showPreview ? "Hide" : "Show"} Preview with resolved References`}
        >
          {showPreview ? <>Hide Preview</> : <>Show preview</>}
        </Button>
      </div>
      {showPreview && localText && (
        <div className="prose-invert rounded border border-border/40 bg-muted/20 p-3 text-sm leading-relaxed text-muted-foreground">
          <span className="text-muted-foreground">
            <RenderInline text={localText} ctx={ctx} />
          </span>
        </div>
      )}
    </div>
  )
}
