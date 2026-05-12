import { ChevronDown, ChevronUp, Plus, Trash2, X } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { uid, type KeyValuePair, type KeyValueSet } from "@/lib/gamedoc-types"
import { useRef, useState } from "react"
import { flushSync } from "react-dom"
import { InsertLinkPopover } from "./InsertLinkPopover"
import { ReferencePicker } from "./ReferencePicker"
import { VariablePicker } from "./VariablePicker"
import { formatVariableReference } from "@/lib/reference-syntax"
import type { Ctx, Section } from "@/lib/gamedoc-types"
import { RenderInline } from "./RenderInline"
import { useEditorInput } from "@/hooks/use-editable-input"

export function KeyValueView({
  keyValue,
  ctx,
  allSections,
  onChange,
  onRemove,
}: {
  keyValue: KeyValueSet
  ctx: Ctx
  allSections: Section[]
  onChange: (
    fn: (d: KeyValueSet) => { subtitle?: string; pairs: KeyValuePair[] }
  ) => void
  onRemove: () => void
}) {
  const [local, setLocal] = useState(keyValue)
  const [expanded, setExpanded] = useState(true)
  const [showPreview, setShowPreview] = useState(false)

  // Track which input is focused: { index, field: "key" | "value" }
  const focusedRef = useRef<{ index: number; field: "key" | "value" } | null>(
    null
  )
  // Refs for all inputs: inputRefs[i][0] = key, inputRefs[i][1] = value
  const inputRefs = useRef<
    Record<number, { key?: HTMLInputElement; value?: HTMLInputElement }>
  >({})

  const insert = (snippet: string) => {
    const focused = focusedRef.current
    if (!focused) return
    const { index, field } = focused
    const input = inputRefs.current[index]?.[field]
    if (!input) return

    const start = input.selectionStart ?? local.pairs[index][field].length
    const end = input.selectionEnd ?? local.pairs[index][field].length
    const prev = local.pairs[index][field]
    const next = prev.slice(0, start) + snippet + prev.slice(end)

    flushSync(() => {
      setLocal((d) => ({
        ...d,
        pairs: d.pairs.map((p, j) =>
          j === index ? { ...p, [field]: next } : p
        ),
      }))
      onChange((d) => ({
        ...d,
        pairs: d.pairs.map((p, j) =>
          j === index ? { ...p, [field]: next } : p
        ),
      }))
    })

    input.focus()
    input.setSelectionRange(start + snippet.length, start + snippet.length)
  }

  return (
    <div className="relative mt-4 rounded-lg border border-border/60 p-3 px-3">
      <span className="absolute -top-2 bg-background px-3 text-xs text-muted-foreground">
        Key-value Set
      </span>
      <div className="flex items-center justify-between">
        <input
          value={local.subtitle ?? ""}
          onChange={(e) =>
            setLocal((prev) => ({ ...prev, subtitle: e.target.value }))
          }
          onBlur={() => onChange((d) => ({ ...d, subtitle: local.subtitle }))}
          className="mb-3 flex-1 bg-transparent outline-none"
          placeholder="Subtitle (optional)"
        />
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        <Button size="icon" variant="ghost" onClick={onRemove}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {expanded && (
        <dl className="space-y-1.5">
          {local.pairs.map((p, i) => (
            <Pair
              key={p.id}
              focusedRef={focusedRef}
              index={i}
              local={local}
              onChange={onChange}
              pair={p}
              setLocal={setLocal}
              keyInputRefCb={(el) => {
                inputRefs.current[i] = {
                  ...inputRefs.current[i],
                  key: el ?? undefined,
                }
              }}
              valueInputRefCb={(el) => {
                inputRefs.current[i] = {
                  ...inputRefs.current[i],
                  value: el ?? undefined,
                }
              }}
            />
          ))}
        </dl>
      )}

      {showPreview && local.pairs.length > 0 && (
        <dl className="mt-2 rounded border border-border/40 bg-muted/20 p-2 text-sm leading-relaxed">
          {local.pairs.map((p) => (
            <div key={p.id} className="flex gap-2">
              <dt className="shrink-0 text-muted-foreground/60">
                {p.key || <em>key</em>}:
              </dt>
              <dd className="text-muted-foreground">
                <RenderInline ctx={ctx} text={p.value} />
              </dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-2 flex items-center justify-start gap-2">
        <div className="w-40">
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => {
              const newPair = { id: uid(), key: "", value: "" }
              setLocal((prev) => ({ ...prev, pairs: [...prev.pairs, newPair] }))
              onChange((d) => ({ ...d, pairs: [...d.pairs, newPair] }))
              if (!expanded) setExpanded(true)
              // Focus the new row's key input after render
              const newIndex = local.pairs.length
              setTimeout(() => {
                inputRefs.current[newIndex]?.key?.focus()
              }, 0)
            }}
          >
            <Plus className="h-3.5 w-3.5" /> Add pair
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <InsertLinkPopover onInsert={insert} />
          <ReferencePicker
            allSections={allSections}
            onPick={(ref) => insert(ref)}
          />
          <VariablePicker
            allSections={allSections}
            onPick={(id, name) => insert(formatVariableReference(id, name))}
          />
          <Button
            size="sm"
            variant="ghost"
            className={showPreview ? "bg-muted hover:bg-muted/90" : ""}
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? "Hide preview" : "Show preview"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function Pair({
  pair,
  index,
  local,
  focusedRef,
  keyInputRefCb,
  valueInputRefCb,
  setLocal,
  onChange,
}: {
  pair: KeyValuePair
  index: number
  local: KeyValueSet
  focusedRef: React.RefObject<{
    index: number
    field: "key" | "value"
  } | null>
  keyInputRefCb: React.RefCallback<HTMLInputElement>
  valueInputRefCb: React.RefCallback<HTMLInputElement>

  onChange: (
    fn: (d: KeyValueSet) => {
      subtitle?: string
      pairs: KeyValuePair[]
    }
  ) => void
  setLocal: (value: React.SetStateAction<KeyValueSet>) => void
}) {
  const mergedKeyInputRef = useEditorInput<HTMLInputElement>(keyInputRefCb)
  const mergedValueInputRef = useEditorInput<HTMLInputElement>(valueInputRefCb)

  return (
    <div key={pair.id} className="group/pair flex items-center gap-2">
      <Input
        ref={mergedKeyInputRef}
        value={pair.key}
        placeholder="Key"
        className="h-7 w-40 rounded-md border-border/75 bg-transparent! text-sm"
        onFocus={() => {
          focusedRef.current = { index: index, field: "key" }
        }}
        onChange={(e) => {
          const key = e.target.value
          setLocal((prev) => ({
            ...prev,
            pairs: prev.pairs.map((x, j) => (j === index ? { ...x, key } : x)),
          }))
        }}
        onBlur={() =>
          onChange((d) => ({
            ...d,
            pairs: d.pairs.map((x, j) =>
              j === index ? { ...x, key: local.pairs[index].key } : x
            ),
          }))
        }
      />
      <span className="text-muted-foreground">:</span>
      <Input
        ref={mergedValueInputRef}
        value={pair.value}
        placeholder="Value"
        className="h-7 flex-1 rounded-md border-border/75 bg-transparent! text-sm"
        onFocus={() => {
          focusedRef.current = { index: index, field: "value" }
        }}
        onChange={(e) => {
          const value = e.target.value
          setLocal((prev) => ({
            ...prev,
            pairs: prev.pairs.map((x, j) =>
              j === index ? { ...x, value } : x
            ),
          }))
        }}
        onBlur={() =>
          onChange((d) => ({
            ...d,
            pairs: d.pairs.map((x, j) =>
              j === index ? { ...x, value: local.pairs[index].value } : x
            ),
          }))
        }
      />
      <Button
        size="icon"
        variant="ghost"
        className="opacity-0 transition-opacity group-hover/pair:opacity-100"
        onClick={() => {
          setLocal((prev) => ({
            ...prev,
            pairs: prev.pairs.filter((_, j) => j !== index),
          }))
          onChange((d) => ({
            ...d,
            pairs: d.pairs.filter((_, j) => j !== index),
          }))
          if (focusedRef.current?.index === index) focusedRef.current = null
        }}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  )
}
