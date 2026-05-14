// lib/comment-utils.ts
import { type Comment, type CommentScope, type GameDoc } from "./gamedoc-types"
import { sectionId, headingId, blockId } from "./utils"

// ── ID helpers ───────────────────────────────────────────────────────────────

/**
 * Resolves a comment scope to the DOM id of the element it should scroll to.
 * Returns null for the global scope (nothing to scroll to).
 *
 * NOTE: block ids are globally unique (uid()), so `blockId` only needs the
 * block's own id. The scope still carries sectionId/containerId — those are
 * used for labelling, not navigation.
 */
export function scopeToElementId(scope: CommentScope): string | null {
  switch (scope.kind) {
    case "global":
      return null
    case "section":
      return sectionId(scope.sectionId)
    case "container":
      return headingId(scope.sectionId, scope.containerId)
    case "block":
      return blockId(scope.blockId)
  }
}

// ── Labelling ────────────────────────────────────────────────────────────────

export function scopeLabel(scope: CommentScope, doc: GameDoc): string {
  if (scope.kind === "global") return "Global"

  const section = doc.sections.find((s) => s.id === scope.sectionId)
  const sLabel = section?.title || "Untitled section"
  if (scope.kind === "section") return sLabel

  const container = section?.containers.find((c) => c.id === scope.containerId)
  const cLabel = container?.title || "Untitled"
  if (scope.kind === "container") return `${sLabel} › ${cLabel}`

  return `${sLabel} › ${cLabel} › block`
}

/** Short label for the popover header — omits the parent breadcrumb. */
export function scopeShortLabel(scope: CommentScope, doc: GameDoc): string {
  if (scope.kind === "global") return "Global"
  const section = doc.sections.find((s) => s.id === scope.sectionId)
  if (scope.kind === "section") return section?.title || "Untitled section"
  const container = section?.containers.find((c) => c.id === scope.containerId)
  if (scope.kind === "container") return container?.title || "Untitled"
  return "Block"
}

// ── Scope <-> string value (for the Command picker) ──────────────────────────

export interface ScopeOption {
  label: string
  value: string
  scope: CommentScope
  depth: number
}

export function buildScopeOptions(doc: GameDoc): ScopeOption[] {
  const opts: ScopeOption[] = [
    { label: "Global", value: "global", scope: { kind: "global" }, depth: 0 },
  ]
  doc.sections.forEach((s) => {
    opts.push({
      label: s.title || "Untitled section",
      value: `section:${s.id}`,
      scope: { kind: "section", sectionId: s.id },
      depth: 0,
    })
    s.containers.forEach((c) => {
      opts.push({
        label: c.title || "Untitled",
        value: `container:${s.id}:${c.id}`,
        scope: { kind: "container", sectionId: s.id, containerId: c.id },
        depth: 1,
      })
    })
  })
  return opts
}

export function scopeToValue(sc: CommentScope): string {
  switch (sc.kind) {
    case "global":
      return "global"
    case "section":
      return `section:${sc.sectionId}`
    case "container":
      return `container:${sc.sectionId}:${sc.containerId}`
    case "block":
      return `block:${sc.sectionId}:${sc.containerId}:${sc.blockId}`
  }
}

/** Two scopes refer to the same target. */
export function scopeEquals(a: CommentScope, b: CommentScope): boolean {
  return scopeToValue(a) === scopeToValue(b)
}

/**
 * Does `parent` contain `child`? Global contains everything; a section
 * contains its containers and their blocks; a container contains its blocks.
 */
export function scopeContains(
  parent: CommentScope,
  child: CommentScope
): boolean {
  if (parent.kind === "global") return true
  if (child.kind === "global") return false

  if (parent.kind === "section") {
    return "sectionId" in child && child.sectionId === parent.sectionId
  }
  if (parent.kind === "container") {
    return (
      (child.kind === "container" || child.kind === "block") &&
      child.sectionId === parent.sectionId &&
      child.containerId === parent.containerId
    )
  }
  // parent.kind === "block"
  return child.kind === "block" && child.blockId === parent.blockId
}

// ── Tree (for the modal's left pane) ─────────────────────────────────────────

export interface ScopeTreeNode {
  /** Stable string id used by the tree UI. */
  key: string
  label: string
  scope: CommentScope
  depth: number
  children: ScopeTreeNode[]
}

export function buildScopeTree(doc: GameDoc): ScopeTreeNode[] {
  const global: ScopeTreeNode = {
    key: "global",
    label: "Global",
    scope: { kind: "global" },
    depth: 0,
    children: [],
  }

  const sections: ScopeTreeNode[] = doc.sections.map((s) => ({
    key: `section:${s.id}`,
    label: s.title || "Untitled section",
    scope: { kind: "section", sectionId: s.id },
    depth: 0,
    children: s.containers.map((c) => ({
      key: `container:${s.id}:${c.id}`,
      label: c.title || "Untitled",
      scope: { kind: "container", sectionId: s.id, containerId: c.id },
      depth: 1,
      children: [],
    })),
  }))

  return [global, ...sections]
}

// ── Filtering ────────────────────────────────────────────────────────────────

export type FilterKind = "all" | "open" | "resolved"

export function matchesFilter(c: Comment, filter: FilterKind): boolean {
  if (filter === "open") return !c.resolved
  if (filter === "resolved") return c.resolved
  return true
}

// ── Read state ───────────────────────────────────────────────────────────────

/** A comment counts as read by its author and by anyone listed in `readBy`. */
export function isReadBy(c: Comment, author: string): boolean {
  if (!author) return true
  if (c.author === author) return true
  return (c.readBy ?? []).includes(author)
}

// ── Time formatting ──────────────────────────────────────────────────────────

export function formatTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return "just now"
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return new Date(ts).toLocaleDateString()
}

// ── Author persistence ───────────────────────────────────────────────────────

const AUTHOR_KEY = "gamedoc:author"

export function getSavedAuthor(): string {
  if (typeof localStorage === "undefined") return ""
  return localStorage.getItem(AUTHOR_KEY) ?? ""
}

export function saveAuthor(name: string) {
  if (typeof localStorage === "undefined") return
  localStorage.setItem(AUTHOR_KEY, name)
}
