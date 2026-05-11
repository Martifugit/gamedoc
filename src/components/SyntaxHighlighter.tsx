import React from "react"

// ── Types ────────────────────────────────────────────────────────────────────

type VariableToken = {
  kind: "var"
  raw: string
  id: string
  name: string
}

type ReferenceToken = {
  kind: "ref"
  raw: string
  targetId: string
  name: string
  customLabel?: string
}

type LinkToken = {
  kind: "link"
  raw: string
  label: string
  url: string
}

type TextToken = {
  kind: "text"
  value: string
}

type Token = VariableToken | ReferenceToken | LinkToken | TextToken

// ── Tokenizer ────────────────────────────────────────────────────────────────

const TOKEN_PATTERN =
  /(\{\{var:[^}:]+:[^}]*\}\}|\[\[ref:[^\]|]+:[^\]|]+(?:\|[^\]]+)?\]\]|\[([^\]]+)\]\((https?:\/\/[^)]+)\))/g

function tokenize(text: string): Token[] {
  const tokens: Token[] = []
  let last = 0
  let match: RegExpExecArray | null

  TOKEN_PATTERN.lastIndex = 0

  while ((match = TOKEN_PATTERN.exec(text)) !== null) {
    if (match.index > last) {
      tokens.push({ kind: "text", value: text.slice(last, match.index) })
    }

    const raw = match[0]

    if (raw.startsWith("{{var:")) {
      // {{var:id:name}}
      const inner = raw.slice(2, -2) // strip {{ }}
      const parts = inner.split(":")
      // parts = ["var", id, name]
      const id = parts[1]
      const name = parts.slice(2).join(":")
      tokens.push({ kind: "var", raw, id, name })
    } else if (raw.startsWith("[[ref:")) {
      // [[ref:targetId:name]] or [[ref:targetId:name|customLabel]]
      const inner = raw.slice(2, -2) // strip [[ ]]
      const withoutPrefix = inner.slice(4) // strip "ref:"
      const pipeIdx = withoutPrefix.indexOf("|")
      const body =
        pipeIdx === -1 ? withoutPrefix : withoutPrefix.slice(0, pipeIdx)
      const customLabel =
        pipeIdx === -1 ? undefined : withoutPrefix.slice(pipeIdx + 1)
      const colonIdx = body.indexOf(":")
      const targetId = body.slice(0, colonIdx)
      const name = body.slice(colonIdx + 1)
      tokens.push({ kind: "ref", raw, targetId, name, customLabel })
    } else {
      // [label](url)
      const label = match[2]
      const url = match[3]
      tokens.push({ kind: "link", raw, label, url })
    }

    last = match.index + raw.length
  }

  if (last < text.length) {
    tokens.push({ kind: "text", value: text.slice(last) })
  }

  return tokens
}

// ── Sub-components ────────────────────────────────────────────────────────────

type VarProps = {
  token: VariableToken
  renderVar?: (token: VariableToken) => React.ReactNode
}

function VarChip({ token, renderVar }: VarProps) {
  if (renderVar) return <>{renderVar(token)}</>
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 1,
        fontFamily: "monospace",
        fontSize: "0.88em",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ opacity: 0.4 }}>{"{{var:"}</span>
      <span style={{ opacity: 0.35, fontSize: "0.9em" }}>{token.id}:</span>
      <strong style={{ fontWeight: 600 }}>{token.name}</strong>
      <span style={{ opacity: 0.4 }}>{"}}"}</span>
    </span>
  )
}

type RefProps = {
  token: ReferenceToken
  renderRef?: (token: ReferenceToken) => React.ReactNode
}

function RefChip({ token, renderRef }: RefProps) {
  if (renderRef) return <>{renderRef(token)}</>
  const label = token.customLabel ?? token.name
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 1,
        fontSize: "0.9em",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ opacity: 0.4 }}>{"[["}</span>
      <strong style={{ fontWeight: 600 }}>{label}</strong>
      <span style={{ opacity: 0.4 }}>
        {token.customLabel ? ` (${token.name})` : ""}
      </span>
      <span style={{ opacity: 0.4 }}>{" ]]"}</span>
    </span>
  )
}

type LinkProps = {
  token: LinkToken
  renderLink?: (token: LinkToken) => React.ReactNode
}

function LinkChip({ token, renderLink }: LinkProps) {
  if (renderLink) return <>{renderLink(token)}</>
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 3,
        fontSize: "0.9em",
        whiteSpace: "nowrap",
      }}
    >
      <strong style={{ fontWeight: 600 }}>{token.label}</strong>
      <span
        style={{ opacity: 0.45, fontSize: "0.82em", fontFamily: "monospace" }}
      >
        {token.url}
      </span>
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export type SyntaxHighlighterProps = {
  /** The raw string possibly containing {{var:…}}, [[ref:…]], and [label](url) tokens. */
  children: string

  /** Override rendering for variable tokens. */
  renderVar?: (token: VariableToken) => React.ReactNode

  /** Override rendering for reference tokens. */
  renderRef?: (token: ReferenceToken) => React.ReactNode

  /** Override rendering for markdown link tokens. */
  renderLink?: (token: LinkToken) => React.ReactNode

  /** Wrapper element. Defaults to <span> so it's safe inline. */
  as?: keyof React.JSX.IntrinsicElements

  className?: string
  style?: React.CSSProperties
}

export function SyntaxHighlighter({
  children,
  renderVar,
  renderRef,
  renderLink,
  as: Tag = "span",
  className,
  style,
}: SyntaxHighlighterProps) {
  const tokens = tokenize(children)

  return (
    <Tag className={className} style={style}>
      {tokens.map((token, i) => {
        switch (token.kind) {
          case "text":
            return <React.Fragment key={i}>{token.value}</React.Fragment>
          case "var":
            return <VarChip key={i} token={token} renderVar={renderVar} />
          case "ref":
            return <RefChip key={i} token={token} renderRef={renderRef} />
          case "link":
            return <LinkChip key={i} token={token} renderLink={renderLink} />
        }
      })}
    </Tag>
  )
}

// Re-export token types so consumers can type their render props
export type { VariableToken, ReferenceToken, LinkToken, Token }
