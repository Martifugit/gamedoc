// lib/clipboard-clone.ts
import type { ClipboardItem } from "@/context/use-clipboard"
import { uid, type Block, type KeyValueSet } from "./gamedoc-types"

export function cloneBlockForPaste(block: Block): Block {
  switch (block.type) {
    case "paragraph":
      return { ...block, id: uid() }
    case "list":
      return { ...block, id: uid(), items: [...block.items] }
    case "table":
      return {
        ...block,
        id: uid(),
        headers: [...block.headers],
        rows: block.rows.map((r) => [...r]),
      }
  }
}

export function cloneKeyValueForPaste(kv: KeyValueSet): KeyValueSet {
  return {
    ...kv,
    pairs: kv.pairs.map((p) => ({ ...p, id: uid() })),
  }
}

export function cloneBlock(item: ClipboardItem) {
  return item.kind === "block"
    ? (["block", cloneBlockForPaste(item.data)] as const)
    : (["keyvalue", cloneKeyValueForPaste(item.data)] as const)
}
