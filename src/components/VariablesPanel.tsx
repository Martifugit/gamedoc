import { uid, type Section, type Variable } from "@/lib/gamedoc-types"
import { Plus, Trash2, X } from "lucide-react"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { ConfirmDelete } from "./ConfirmDelete"
import { useState } from "react"
import { formatVariableReference } from "@/lib/reference-syntax"

export function VariablesPanel({
  section,
  onChange,
  onClose,
}: {
  section: Section
  onChange: (fn: (s: Section) => Section) => void
  onClose: () => void
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="relative mb-2 flex items-end">
        <span className="absolute -top-5.5 bg-background px-3 text-sm text-muted-foreground">
          Variables
        </span>
        <button
          className="ml-auto text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-2">
        {section.variables.map((v, index) => (
          <Variable key={v.id} index={index} onChange={onChange} variable={v} />
        ))}
        <Button
          size="sm"
          variant="ghost"
          className="gap-1"
          onClick={() =>
            onChange((s) => ({
              ...s,
              variables: [...s.variables, { id: uid(), name: "", value: "" }],
            }))
          }
        >
          <Plus className="h-4 w-4" /> Add variable
        </Button>
      </div>
    </div>
  )
}

function Variable({
  variable,
  index,
  onChange,
}: {
  variable: Variable
  index: number
  onChange: (fn: (s: Section) => Section) => void
}) {
  const [localVarName, setLocalVarName] = useState(variable.name)
  const [localVarVal, setLocalVarVal] = useState(variable.value)
  return (
    <div
      key={variable.id}
      className="group relative flex flex-col items-start gap-0.5"
    >
      <code className="pointer-events-none absolute -top-4 rounded bg-accent px-1.5 py-0.5 text-[11px] text-muted-foreground opacity-0 transition-all delay-200 group-hover:-top-6 group-hover:opacity-100 group-hover:delay-600">
        {formatVariableReference(variable.id, variable.name)}
      </code>
      <div className="flex w-full items-center gap-2">
        <Input
          value={localVarName}
          placeholder="name"
          className="h-8 w-40 bg-transparent!"
          onChange={(e) => setLocalVarName(e.currentTarget.value)}
          onBlur={() =>
            onChange((s) => ({
              ...s,
              variables: s.variables.map((x, j) =>
                j === index ? { ...x, name: localVarName } : x
              ),
            }))
          }
        />
        <span className="mx-1 text-lg text-primary">:</span>
        <Input
          value={localVarVal}
          placeholder="value"
          className="h-8 flex-1 bg-transparent!"
          onChange={(e) => setLocalVarVal(e.currentTarget.value)}
          onBlur={() =>
            onChange((s) => ({
              ...s,
              variables: s.variables.map((x, j) =>
                j === index ? { ...x, value: localVarVal } : x
              ),
            }))
          }
        />

        <ConfirmDelete
          title="Delete this variable?"
          description={`References to variable: "${variable.name || variable.id || "(unnamed)"}" will be broken.`}
          onConfirm={() =>
            onChange((s) => ({
              ...s,
              variables: s.variables.filter((_, j) => j !== index),
            }))
          }
          trigger={
            <Button size="icon" variant="ghost">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          }
        />
      </div>
    </div>
  )
}
