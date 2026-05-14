// GameDocPreview.tsx
import {
  type GameDoc,
  type Block,
  type Container,
  type Variable,
  type Section,
  type Ctx,
  HEADING_SIZE_BY_LEVEL,
  type KeyValueSet,
} from "@/lib/gamedoc-types"
import { cn, sectionId, headingId } from "@/lib/utils"
import type React from "react"
import { RenderInline } from "./RenderInline"
import ScrollProgressBar from "./scroll-progress"

interface GameDocPreviewProps {
  doc: GameDoc
  className?: string
  ctx: Ctx
}

// Helper to format dates
const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: "full",
    timeStyle: "short",
  })
}

// Paragraph block renderer
const ParagraphBlock = ({ text, ctx }: { text: string; ctx: Ctx }) => {
  return (
    <div className="prose-invert text-sm leading-relaxed text-muted-foreground">
      <RenderInline text={text} ctx={ctx} />
    </div>
  )
}

// List block renderer - NOW resolves inline syntax
const ListBlock = ({
  ordered,
  items,
  ctx,
}: {
  ordered: boolean
  items: string[]
  ctx: Ctx
}) => {
  const ListTag = ordered ? "ol" : "ul"
  return (
    <ListTag
      className={cn("space-y-1 pl-6", ordered ? "list-decimal" : "list-disc")}
    >
      {items.map((item, idx) => (
        <li key={idx} className="leading-relaxed text-foreground">
          <RenderInline text={item} ctx={ctx} />
        </li>
      ))}
    </ListTag>
  )
}

// Table block renderer - NOW resolves inline syntax in cells
const TableBlock = ({
  headers,
  rows,
  ctx,
}: {
  headers: string[]
  rows: string[][]
  ctx: Ctx
}) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr className="border-b border-border">
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-4 py-3 text-left font-semibold text-foreground"
              >
                <RenderInline text={header} ctx={ctx} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className={cn(
                "border-b border-border last:border-0",
                rowIdx % 2 === 0 ? "bg-background" : "bg-muted/20"
              )}
            >
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="px-4 py-2 text-foreground/80">
                  <RenderInline text={cell} ctx={ctx} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Details panel - resolves inline syntax in values
const KeyValuePanel = ({
  keyValues,
  ctx,
}: {
  keyValues: KeyValueSet[] | undefined
  ctx: Ctx
}) => {
  const hasContent = (kv: KeyValueSet | undefined) =>
    kv ? kv.pairs.some((p) => p.key.trim() || p.value.trim()) : false

  if (!keyValues?.length || !keyValues?.some(hasContent)) return null

  return (
    <>
      {keyValues.map((kv, i) => {
        if (!kv.pairs.length) return null
        return (
          <div
            key={`kv-preview-${i}`}
            className="mt-4 rounded-lg border border-border bg-muted/30 p-4"
          >
            {kv.subtitle && (
              <h4 className="mb-3 text-sm font-semibold text-foreground">
                {kv.subtitle}
              </h4>
            )}
            <dl className="space-y-2 text-sm">
              {kv.pairs.map((pair) => (
                <div key={pair.id} className="grid grid-cols-3 gap-2">
                  <dt className="col-span-1 font-medium text-foreground/70">
                    <RenderInline text={pair.key} ctx={ctx} />
                  </dt>
                  <dd className="col-span-2 wrap-break-word text-foreground">
                    <RenderInline text={pair.value} ctx={ctx} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )
      })}
    </>
  )
}

// Variables table - resolves inline syntax in values
const VariablesTable = ({
  variables,
  ctx,
}: {
  variables: Variable[]
  ctx: Ctx
}) => {
  if (!variables.length) return null

  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-border">
      <div className="border-b border-border bg-muted/50 px-4 py-2">
        <h3 className="text-sm font-semibold text-foreground">Variables</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr className="border-b border-border">
              <th className="px-4 py-2 text-left font-medium text-foreground/70">
                Name
              </th>
              <th className="px-4 py-2 text-left font-medium text-foreground/70">
                Value
              </th>
            </tr>
          </thead>
          <tbody>
            {variables.map((variable) => (
              <tr
                key={variable.id}
                className="border-b border-border last:border-0"
              >
                <td className="px-4 py-2 font-mono text-sm text-foreground/90">
                  {variable.name}
                </td>
                <td className="wrap-break-words px-4 py-2 text-foreground/80">
                  <RenderInline text={variable.value} ctx={ctx} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Block router - passes ctx to all blocks
const BlockRenderer = ({ block, ctx }: { block: Block; ctx: Ctx }) => {
  switch (block.type) {
    case "paragraph":
      return <ParagraphBlock text={block.text} ctx={ctx} />
    case "list":
      return <ListBlock ordered={block.ordered} items={block.items} ctx={ctx} />
    case "table":
      return <TableBlock headers={block.headers} rows={block.rows} ctx={ctx} />
    default:
      return null
  }
}

// Container component (heading + blocks + optional details)
const ContainerRenderer = ({
  container,
  ctx,
  parentSectionId,
}: {
  container: Container
  ctx: Ctx
  parentSectionId: string
}) => {
  const HeadingTag = `h${container.level}` as keyof React.JSX.IntrinsicElements

  const additionalStyles = {
    1: "mt-8 mb-4 pb-2 ",
    2: "mt-6 mb-3 opacity-90",
    3: "mt-5 mb-2 opacity-85",
    4: "mt-4 mb-2 opacity-80",
    5: "mt-3 mb-2 opacity-75",
    6: "my-2 font-bold opacity-65",
  }[container.level]

  const headingSize = HEADING_SIZE_BY_LEVEL[container.level]

  const headingStyles = `${additionalStyles} ${headingSize}`

  return (
    <div className="scroll-mt-24" id={headingId(parentSectionId, container.id)}>
      <HeadingTag className={headingStyles}>{container.title}</HeadingTag>

      <div className="space-y-4">
        {container.blocks.map((block) => (
          <BlockRenderer key={block.id} block={block} ctx={ctx} />
        ))}
      </div>

      {container.keyValues && (
        <KeyValuePanel keyValues={container.keyValues} ctx={ctx} />
      )}
    </div>
  )
}

// Section component
const SectionRenderer = ({ section, ctx }: { section: Section; ctx: Ctx }) => {
  return (
    <section id={sectionId(section.id)} className="scroll-mt-24">
      <div className="mb-6 pb-3">
        <h2 className="mb-3 text-4xl font-bold text-foreground">
          {section.title}
        </h2>
        {section.description && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            <RenderInline text={section.description} ctx={ctx} />
          </p>
        )}
      </div>

      <div className="space-y-8">
        {section.containers.map((container: Container) => (
          <ContainerRenderer
            key={container.id}
            container={container}
            ctx={ctx}
            parentSectionId={section.id}
          />
        ))}
      </div>

      {section.variables && section.variables.length > 0 && (
        <VariablesTable variables={section.variables} ctx={ctx} />
      )}
    </section>
  )
}

// Empty state component
const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-muted/50 p-4">
        <svg
          className="h-8 w-8 text-foreground/40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 className="mb-1 text-lg font-semibold text-foreground">
        No Content Yet
      </h3>
      <p className="max-w-sm text-foreground/60">
        Add sections, containers, and content to start building your game
        documentation.
      </p>
    </div>
  )
}

// Main Preview Component
export function GameDocPreview({ doc, className, ctx }: GameDocPreviewProps) {
  const hasContent = doc.sections.length > 0

  return (
    <div className={cn("relative flex min-h-screen flex-col", className)}>
      <div className="sticky top-0 z-30 h-16 border-b border-border bg-background">
        <ScrollProgressBar />
        <div className="relative z-2 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-black text-foreground">{doc.title}</h1>
            <span className="font-mono text-xs text-foreground/40">
              Updated {formatDate(doc.updatedAt)}
            </span>
          </div>
        </div>
        <div className="absolute inset-x-0 top-16 z-1 h-10 bg-linear-to-b from-background to-transparent" />
      </div>

      <main className="h-full px-6 py-8">
        {hasContent ? (
          <div className="space-y-12">
            {doc.sections.map((section) => (
              <SectionRenderer key={section.id} section={section} ctx={ctx} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  )
}
