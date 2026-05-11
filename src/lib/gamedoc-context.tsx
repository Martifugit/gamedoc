import { createContext, useContext } from "react"
import type { Ctx, Section } from "./gamedoc-types"

type DocEditorCtx = {
  ctx: Ctx
  allSections: Section[]
}

const DocEditorContext = createContext<DocEditorCtx | null>(null)

export const DocEditorProvider = DocEditorContext.Provider

export function useDocEditor() {
  const value = useContext(DocEditorContext)
  if (!value) throw new Error("useDocEditor used outside DocEditorProvider")
  return value
}
