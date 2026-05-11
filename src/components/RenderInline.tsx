// renderInline.tsx
import type { Variable } from "@/lib/gamedoc-types"
import { ExternalLink } from "lucide-react"
import {
  SyntaxHighlighter,
  type LinkToken,
  type ReferenceToken,
  type VariableToken,
} from "./SyntaxHighlighter"
import { getReferenceHash } from "@/lib/reference-syntax"

interface Ctx {
  headings: Map<string, string>
  vars: Map<string, Variable>
}

interface Props {
  text: string
  ctx: Ctx
}

export function RenderInline({ text, ctx }: Props) {
  function renderVar(token: VariableToken) {
    const v = ctx.vars.get(token.id)
    return (
      <span
        className="rounded bg-accent px-1.5 py-0.5 text-xs font-medium text-accent-foreground"
        title={v ? `${v.name} = ${v.value}` : "missing variable"}
      >
        {v ? v.value : `?${token.name}`}
      </span>
    )
  }

  function renderRef(token: ReferenceToken) {
    const liveTitle = ctx.headings.get(token.targetId)
    const label = token.customLabel ?? liveTitle ?? token.name
    const hash = getReferenceHash(token.targetId)
    return (
      <a
        href={hash}
        className="text-blue-500 underline-offset-4 hover:underline"
        title={`Reference to: ${token.name}`}
      >
        {label}
      </a>
    )
  }

  function renderLink(token: LinkToken) {
    return (
      <a
        href={token.url}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex items-center gap-0.5 text-blue-500 underline-offset-4 hover:underline"
        title={`Link to: ${token.url}`}
      >
        {token.label}
        <ExternalLink className="h-3 w-3" />
      </a>
    )
  }

  return (
    <SyntaxHighlighter
      renderVar={renderVar}
      renderRef={renderRef}
      renderLink={renderLink}
    >
      {text}
    </SyntaxHighlighter>
  )
}
