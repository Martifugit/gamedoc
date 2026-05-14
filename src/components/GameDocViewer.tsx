import { Fragment, useState } from "react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChevronRight, ChevronDown } from "lucide-react"
import type {
  GameDoc,
  Section,
  Container,
  Block,
  ParagraphBlock,
  ListBlock,
  TableBlock,
  KeyValueSet,
  KeyValuePair,
  Variable,
} from "@/lib/gamedoc-types"

// Type guards
const isParagraphBlock = (block: Block): block is ParagraphBlock =>
  block.type === "paragraph"

const isListBlock = (block: Block): block is ListBlock => block.type === "list"

const isTableBlock = (block: Block): block is TableBlock =>
  block.type === "table"

// Simple block renderer
const BlockRenderer = ({ block }: { block: Block }) => {
  if (isParagraphBlock(block)) {
    return (
      <div className="py-1">
        <span className="text-sm text-muted-foreground">{block.text}</span>
      </div>
    )
  }

  if (isListBlock(block)) {
    const ListTag = block.ordered ? "ol" : "ul"
    return (
      <div className="space-y-1">
        {block.heading && (
          <div className="text-sm font-medium text-foreground">
            {block.heading}
          </div>
        )}
        <ListTag
          className={`list-inside ${block.ordered ? "list-decimal" : "list-disc"}`}
        >
          {block.items.map((item, idx) => (
            <li key={idx} className="text-sm text-muted-foreground">
              {item}
            </li>
          ))}
        </ListTag>
      </div>
    )
  }

  if (isTableBlock(block)) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            {block.headers.map((header, idx) => (
              <TableHead key={idx}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {block.rows.map((row, rowIdx) => (
            <TableRow key={rowIdx}>
              {row.map((cell, cellIdx) => (
                <TableCell key={cellIdx}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  return null
}

// KeyValue pairs renderer
const KeyValueRenderer = ({ pairs }: { pairs: KeyValuePair[] }) => {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-md border bg-muted/20 p-3 text-sm">
      {pairs.map((pair) => (
        <Fragment key={pair.id}>
          <span className="font-medium text-foreground">{pair.key}:</span>
          <span className="text-muted-foreground">{pair.value}</span>
        </Fragment>
      ))}
    </div>
  )
}

// Container renderer (collapsible by default)
const ContainerRenderer = ({ container }: { container: Container }) => {
  const [isOpen, setIsOpen] = useState(false)

  const hasContent =
    container.blocks.length > 0 ||
    (container.keyValues && container.keyValues.length > 0)

  if (!hasContent) {
    return (
      <div className="py-1">
        <span className="text-sm text-muted-foreground italic">
          Empty container
        </span>
      </div>
    )
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-accent/50">
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="text-sm font-medium">{container.title}</span>
        <Badge variant="secondary" className="text-xs">
          L{container.level}
        </Badge>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-3 pl-6">
        {container.blocks.map((block) => (
          <BlockRenderer key={block.id} block={block} />
        ))}
        {container.keyValues?.map((kvSet: KeyValueSet, idx: number) => (
          <div key={idx} className="space-y-1">
            {kvSet.subtitle && (
              <div className="text-sm font-medium text-muted-foreground">
                {kvSet.subtitle}
              </div>
            )}
            <KeyValueRenderer pairs={kvSet.pairs} />
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

// Section renderer (collapsible by default)
const SectionRenderer = ({ section }: { section: Section }) => {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent/50">
        {isOpen ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        )}
        <h2 className="text-xl font-semibold">{section.title}</h2>
        <Badge variant="outline" className="ml-auto">
          {section.containers.length} containers
        </Badge>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 space-y-4 pl-4">
        {section.description && (
          <p className="border-l-2 border-border pl-3 text-sm text-muted-foreground italic">
            {section.description}
          </p>
        )}

        {/* Variables */}
        {section.variables.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Variables
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {section.variables.map((variable: Variable) => (
                <div key={variable.id} className="flex gap-2">
                  <span className="font-mono text-foreground">
                    {variable.name}
                  </span>
                  <span className="text-muted-foreground">=</span>
                  <span className="text-muted-foreground">
                    {variable.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Containers */}
        {section.containers.map((container) => (
          <ContainerRenderer key={container.id} container={container} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

// Main component
export const GameDocViewer = ({ doc }: { doc: GameDoc }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold">{doc.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Last updated: {new Date(doc.updatedAt).toLocaleString()}
        </p>
      </div>

      {/* Sections */}
      {doc.sections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}

      {/* Empty state */}
      {doc.sections.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          No sections yet
        </div>
      )}
    </div>
  )
}
