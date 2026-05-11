export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6
export type HeadingLevelCssString = "h1" | "h2" | "h3" | "h4" | "h5" | "h6"

export const HEADING_SIZE_BY_LEVEL: Record<HeadingLevel, string> = {
  1: "text-4xl font-bold",
  2: "text-3xl font-semibold",
  3: "text-2xl font-semibold",
  4: "text-xl font-medium",
  5: "text-lg font-medium",
  6: "text-base font-medium",
}

export const HEADING_LEVELS: {
  level: HeadingLevel
  string: HeadingLevelCssString
}[] = [
  {
    level: 1,
    string: "h1",
  },
  {
    level: 2,
    string: "h2",
  },
  {
    level: 3,
    string: "h3",
  },
  {
    level: 4,
    string: "h4",
  },
  {
    level: 5,
    string: "h5",
  },
  {
    level: 6,
    string: "h6",
  },
] as const

export type ParagraphBlock = { id: string; type: "paragraph"; text: string }
export type ListBlock = {
  id: string
  heading?: string
  headingLevel?: HeadingLevel
  type: "list"
  ordered: boolean
  items: string[]
}
export type TableBlock = {
  id: string
  type: "table"
  headers: string[]
  rows: string[][]
}
export type Block = ParagraphBlock | ListBlock | TableBlock

export type KeyValuePair = { id: string; key: string; value: string }

export type KeyValueSet = { subtitle?: string; pairs: KeyValuePair[] }

export type Container = {
  id: string
  title: string
  level: HeadingLevel
  blocks: Block[]
  keyValues?: KeyValueSet[]
}

export type Variable = { id: string; name: string; value: string }

export type Section = {
  id: string
  title: string
  description?: string
  containers: Container[]
  variables: Variable[]
}

export type GameDoc = {
  title: string
  sections: Section[]
  updatedAt: number
}

export const uid = () => Math.random().toString(36).slice(2, 10)

export const emptyDoc = (): GameDoc => ({
  title: "Untitled Game Doc",
  sections: [],
  updatedAt: Date.now(),
})

export const newSection = (): Section => ({
  id: uid(),
  title: "New Section",
  containers: [],
  variables: [],
})

export const newContainer = (): Container => ({
  id: uid(),
  title: "New Heading",
  level: 2,
  blocks: [],
  keyValues: [],
})

export type Ctx = { headings: Map<string, string>; vars: Map<string, Variable> }
