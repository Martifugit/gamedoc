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
import { cn, sectionId, headingId, blockId as createBlockId } from "@/lib/utils"
import type React from "react"
import { RenderInline } from "./RenderInline"
import ScrollProgressBar from "./scroll-progress"
import { Fragment } from "react"

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
const ParagraphBlock = ({
  text,
  ctx,
  blockId,
}: {
  text: string
  ctx: Ctx
  containerId: string
  sectionId: string
  blockId: string
}) => {
  return (
    <div
      id={createBlockId(blockId)}
      className="scroll-mt-36 text-sm leading-relaxed text-pretty text-muted-foreground"
    >
      <RenderInline text={text} ctx={ctx} />
    </div>
  )
}

// List block renderer - NOW resolves inline syntax
const ListBlock = ({
  ordered,
  items,
  ctx,
  blockId,
}: {
  containerId: string
  sectionId: string
  blockId: string
  ordered: boolean
  items: string[]
  ctx: Ctx
}) => {
  const ListTag = ordered ? "ol" : "ul"
  return (
    <ListTag
      id={createBlockId(blockId)}
      className={cn(
        "scroll-mt-32 space-y-1 pl-6",
        ordered ? "list-decimal" : "list-disc"
      )}
    >
      {items.map((item, idx) => (
        <li key={idx} className="leading-relaxed text-foreground">
          <RenderInline text={item} ctx={ctx} />
        </li>
      ))}
    </ListTag>
  )
}

const TableBlock = ({
  headers,
  rows,
  ctx,
  blockId,
}: {
  containerId: string
  sectionId: string
  blockId: string
  headers: string[]
  rows: string[][]
  ctx: Ctx
}) => {
  return (
    <div
      id={createBlockId(blockId)}
      className="scroll-mt-32 overflow-x-auto rounded border border-border/70"
    >
      <table className="w-full text-sm">
        <thead className="bg-muted/20">
          <tr className="border-b border-border/70">
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
                "border-b border-border/50 last:border-0",
                rowIdx % 2 === 0 ? "bg-background" : "bg-muted/10"
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
            className="mt-4 rounded-lg border border-border/40 bg-muted/10 p-4"
          >
            {kv.subtitle && (
              <h4 className="mb-3 text-sm font-semibold text-foreground">
                {kv.subtitle}
              </h4>
            )}
            <dl className="text-sm">
              {kv.pairs.map((pair) => (
                <div
                  key={pair.id}
                  className="grid grid-cols-3 gap-2 border-border/30 p-2 not-last:border-b even:bg-muted/4"
                >
                  <dt className="col-span-1 flex items-start justify-between font-medium text-foreground/70">
                    <RenderInline text={pair.key} ctx={ctx} />
                    <span className="mx-1 font-bold text-primary">:</span>
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

const VariablesPanel = ({
  sectionTitle,
  variables,
  ctx,
}: {
  sectionTitle: string
  variables: Variable[]
  ctx: Ctx
}) => {
  if (!variables.length) return null

  return (
    <div>
      <div className="mb-3 space-y-2">
        <h3 className="font-medium">
          <span className="text-blue-500/80">{`${sectionTitle} > `}</span>
          Variables
        </h3>
        <p className="text-sm text-muted-foreground">
          The following Variables are associated with this Section.
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {variables.map((variable) => (
          <div
            key={variable.id}
            className="inline-flex items-center overflow-hidden rounded-full border border-border bg-muted/15 font-mono text-xs whitespace-nowrap"
          >
            <span className="px-3 py-1 text-muted-foreground">
              {variable.name}
            </span>
            <span className="px-0.5 py-1 text-base text-blue-500">=</span>
            <span className="px-3 font-medium text-foreground">
              <RenderInline text={variable.value} ctx={ctx} />
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
// Block router - passes ctx to all blocks
const BlockRenderer = ({
  block,
  ctx,
  sectionId,
  containerId,
}: {
  block: Block
  ctx: Ctx
  containerId: string
  sectionId: string
}) => {
  switch (block.type) {
    case "paragraph":
      return (
        <ParagraphBlock
          sectionId={sectionId}
          containerId={containerId}
          blockId={block.id}
          text={block.text}
          ctx={ctx}
        />
      )
    case "list":
      return (
        <ListBlock
          sectionId={sectionId}
          containerId={containerId}
          blockId={block.id}
          ordered={block.ordered}
          items={block.items}
          ctx={ctx}
        />
      )
    case "table":
      return (
        <TableBlock
          sectionId={sectionId}
          containerId={containerId}
          blockId={block.id}
          headers={block.headers}
          rows={block.rows}
          ctx={ctx}
        />
      )
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
          <BlockRenderer
            containerId={container.id}
            sectionId={parentSectionId}
            key={block.id}
            block={block}
            ctx={ctx}
          />
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
          <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
            <RenderInline text={section.description} ctx={ctx} />
          </p>
        )}
      </div>

      <div className={"space-y-8"}>
        {section.containers.map((container: Container) => (
          <ContainerRenderer
            key={container.id}
            container={container}
            ctx={ctx}
            parentSectionId={section.id}
          />
        ))}

        {section.variables && section.variables.length > 0 && (
          <VariablesPanel
            sectionTitle={section.title}
            variables={section.variables}
            ctx={ctx}
          />
        )}
      </div>
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
    <div className={cn("relative flex min-h-screen flex-col pb-12", className)}>
      <div className="sticky top-0 z-30 border-b border-border bg-background">
        <ScrollProgressBar />
        <div className="relative z-2 px-6 py-4">
          <div className="flex flex-col items-center justify-between gap-3 md:flex-row md:items-end">
            <h1 className="text-2xl font-black text-blue-500">{doc.title}</h1>
            <span className="font-mono text-xs text-foreground/40">
              Updated {formatDate(doc.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      <main className="h-full px-6 py-8">
        {hasContent ? (
          <div className="space-y-12">
            {doc.sections.map((section, idx) => (
              <Fragment key={section.id}>
                <SectionRenderer section={section} ctx={ctx} />
                {idx !== doc.sections.length - 1 && <SectionDivider />}
              </Fragment>
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  )
}

function SectionDivider() {
  return (
    <div className="relative h-8 w-full overflow-hidden opacity-10">
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern
            id="crosshatch"
            width="12"
            height="12"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(0)"
          >
            <line
              x1="0"
              y1="0"
              x2="12"
              y2="12"
              stroke="currentColor"
              strokeWidth="0.75"
            />
            <line
              x1="12"
              y1="0"
              x2="0"
              y2="12"
              stroke="currentColor"
              strokeWidth="0.75"
            />
          </pattern>
          <mask id="fade">
            <rect width="100%" height="100%" fill="url(#fadeGrad)" />
          </mask>
          <linearGradient id="fadeGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="30%" stopColor="white" stopOpacity="1" />
            <stop offset="70%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="url(#crosshatch)"
          mask="url(#fade)"
        />
      </svg>
    </div>
  )
}
