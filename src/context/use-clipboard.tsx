import { createContext, useContext, useState, type ReactNode } from "react"
import type { Block, KeyValueSet } from "@/lib/gamedoc-types"

export type ClipboardItem =
  | { kind: "block"; data: Block }
  | { kind: "keyvalue"; data: KeyValueSet }

type ClipboardContextValue = {
  item: ClipboardItem | null
  copy: (item: ClipboardItem) => void
  clear: () => void
}

const ClipboardContext = createContext<ClipboardContextValue | null>(null)

export function ClipboardProvider({
  children,
}: {
  children: ReactNode
  onCopied?: () => void
}) {
  const [item, setItem] = useState<ClipboardItem | null>(null)

  return (
    <ClipboardContext.Provider
      value={{ item, copy: setItem, clear: () => setItem(null) }}
    >
      {children}
    </ClipboardContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useClipboard() {
  const ctx = useContext(ClipboardContext)
  if (!ctx)
    throw new Error("useClipboard must be used within ClipboardProvider")
  return ctx
}
