// components/comments/CommentsModal.tsx
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Globe,
  MessageSquare,
  Search,
  Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { type CommentScope } from "@/lib/gamedoc-types"
import {
  buildScopeTree,
  scopeContains,
  scopeEquals,
  scopeLabel,
  scopeShortLabel,
  type FilterKind,
  type ScopeTreeNode,
} from "@/lib/comment-utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useComments } from "@/context/comments-provider"
import { AuthorGate, CommentComposer, CommentRow } from "./CommentsPieces"

interface CommentsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultScope?: CommentScope
}

const FILTERS: FilterKind[] = ["open", "resolved", "all"]

// Walks the tree once and returns keys that should start collapsed:
// any node whose subtree has no unread comments.
function deriveInitialCollapsed(
  nodes: ScopeTreeNode[],
  unreadCountForScope: (
    scope: CommentScope,
    opts: { includeDescendants: boolean }
  ) => number
): Set<string> {
  const collapsed = new Set<string>()
  const walk = (node: ScopeTreeNode) => {
    if (
      node.children.length > 0 &&
      unreadCountForScope(node.scope, { includeDescendants: true }) === 0
    ) {
      collapsed.add(node.key)
    }
    node.children.forEach(walk)
  }
  nodes.forEach(walk)
  return collapsed
}

export function CommentsModal({
  open,
  onOpenChange,
  defaultScope,
}: CommentsModalProps) {
  const {
    doc,
    author,
    authorized,
    rootsForScope,
    addComment,
    openCount,
    unreadCount,
    openCountForScope,
    unreadCountForScope,
    markScopeRead,
  } = useComments()

  const [composing, setComposing] = useState(false)
  const [filter, setFilter] = useState<FilterKind>("open")
  const [selected, setSelected] = useState<CommentScope>(
    defaultScope ?? { kind: "global" }
  )
  const [query, setQuery] = useState("")
  // Mobile navigation: start in the tree, drill into comments on select.
  const [mobilePane, setMobilePane] = useState<"tree" | "comments">("tree")

  const tree = useMemo(() => buildScopeTree(doc), [doc])

  // Initial collapsed set derived synchronously — no setState in effects.
  const [collapsed, setCollapsed] = useState<Set<string>>(() =>
    deriveInitialCollapsed(tree, unreadCountForScope)
  )

  // Auto-mark visible comments as read after the user settles on a scope.
  useEffect(() => {
    if (!open || !author) return
    const t = setTimeout(() => {
      markScopeRead(selected, { includeDescendants: true })
    }, 600)
    return () => clearTimeout(t)
  }, [open, author, selected, markScopeRead])

  const toggleCollapsed = useCallback((key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  // Stable callbacks — avoids new references on every render of the parent,
  // which matters if TreeNode is ever wrapped in React.memo.
  const getCountForScope = useCallback(
    (scope: CommentScope) =>
      openCountForScope(scope, { includeDescendants: true }),
    [openCountForScope]
  )
  const getUnreadForScope = useCallback(
    (scope: CommentScope) =>
      unreadCountForScope(scope, { includeDescendants: true }),
    [unreadCountForScope]
  )

  const visibleTree = useMemo(
    () => filterTree(tree, query.trim().toLowerCase()),
    [tree, query]
  )

  const roots = rootsForScope(selected, filter, { includeDescendants: true })
  const needsName = !author

  // On mobile, selecting a scope navigates forward into the comments pane.
  const handleSelectScope = useCallback((scope: CommentScope) => {
    setSelected(scope)
    setMobilePane("comments")
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] max-h-[85vh] w-full flex-col gap-0 overflow-hidden bg-background p-0 sm:max-w-4xl">
        <DialogDescription className="sr-only">
          Manage Comments
        </DialogDescription>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            {/* On mobile show the current context instead of generic "Comments" */}
            <span className="sm:hidden">Comments</span>
            <span className="hidden sm:inline">Comments</span>
            {openCount > 0 && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {openCount} open
              </span>
            )}
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                {unreadCount} new
              </span>
            )}
          </DialogTitle>

          <div className="flex items-center gap-0.5 pr-6">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded px-2 py-0.5 text-[11px] font-medium capitalize transition-colors",
                  filter === f
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </DialogHeader>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        {/*
          Desktop: side-by-side (flex-row). Both panes always visible.
          Mobile:  one pane at a time. The tree is the "list" view; tapping a
                   node pushes you into the "detail" (comments) view. A back
                   button in the header returns you to the tree.
        */}
        <div className="flex min-h-0 flex-1">
          {/* ── Left: scope tree ── */}
          <aside
            className={cn(
              "flex w-full shrink-0 flex-col border-r border-border bg-muted/15",
              // Desktop: fixed sidebar width, always visible.
              "sm:flex sm:w-54",
              // Mobile: full-width when on tree pane, hidden otherwise.
              mobilePane === "tree" ? "flex" : "hidden"
            )}
          >
            <div className="relative h-12.25 border-b border-border p-2">
              <Search className="absolute top-1/2 left-4 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search sections…"
                className="h-8 pl-7"
              />
            </div>

            <ScrollArea className="flex min-h-0 flex-1">
              <div className="flex flex-1 flex-col gap-0.5 p-2">
                {visibleTree.map((node) => (
                  <TreeNode
                    key={node.key}
                    node={node}
                    selected={selected}
                    onSelect={handleSelectScope}
                    collapsed={collapsed}
                    onToggle={toggleCollapsed}
                    countFor={getCountForScope}
                    unreadFor={getUnreadForScope}
                  />
                ))}
                {visibleTree.length === 0 && (
                  <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                    No matches.
                  </p>
                )}
              </div>
            </ScrollArea>
          </aside>

          {/* ── Right: comments + composer ── */}
          <section
            className={cn(
              "flex min-w-0 flex-1 flex-col",
              // Mobile: full-width when on comments pane, hidden otherwise.
              mobilePane === "comments" ? "flex" : "hidden sm:flex"
            )}
          >
            <div className="flex h-12.25 items-center justify-between gap-2 border-b border-border bg-muted/15 px-4 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                {/* Mobile: back button when inside comments pane */}
                {mobilePane === "comments" && (
                  <button
                    onClick={() => setMobilePane("tree")}
                    className="mr-1 flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground sm:hidden"
                    aria-label="Back to sections"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}
                <span className="-mb-px truncate text-xs font-semibold text-foreground">
                  {scopeLabel(selected, doc)}
                </span>
              </div>

              {selected.kind !== "block" && (
                <span className="text-[10px] text-muted-foreground">
                  incl. children
                </span>
              )}
            </div>

            <div className="relative flex min-h-0 flex-1">
              <div
                title={
                  authorized
                    ? undefined
                    : "Failing to authorize results in reduced access"
                }
                className="absolute right-2 bottom-2 z-5 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-px text-[10px] text-accent-foreground/80"
              >
                <Shield
                  size={14}
                  className={authorized ? "text-green-500" : "text-red-500"}
                />
                {authorized ? "Authorized" : "Unauthorized • Access Restricted"}
              </div>
              <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-2 p-4">
                  {roots.length === 0 && (
                    <p className="py-12 text-center text-xs text-muted-foreground">
                      {filter === "open"
                        ? "No open comments here."
                        : filter === "resolved"
                          ? "No resolved comments here."
                          : "No comments here yet."}
                    </p>
                  )}
                  {roots.map((c) => (
                    <CommentRow key={c.id} comment={c} showScope />
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="border-t border-border bg-background p-3">
              {needsName && <AuthorGate />}

              {!composing && !needsName && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-full justify-start text-xs text-muted-foreground"
                  onClick={() => setComposing(true)}
                >
                  <MessageSquare className="mr-2 h-3.5 w-3.5" />
                  Comment on{" "}
                  <span className="ml-1 font-medium text-foreground">
                    {scopeShortLabel(selected, doc)}
                  </span>
                </Button>
              )}

              {!needsName && composing && (
                <CommentComposer
                  author={author}
                  autoFocus
                  placeholder={`Comment on ${scopeShortLabel(selected, doc)} as ${author}…`}
                  header={
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground">
                        Commenting on
                      </span>
                      <span className="rounded border border-border bg-background px-1.5 py-px text-[11px] font-medium text-foreground">
                        {scopeShortLabel(selected, doc)}
                      </span>
                    </div>
                  }
                  onSubmit={(body) => {
                    addComment(selected, body)
                    setComposing(false)
                  }}
                  onCancel={() => setComposing(false)}
                />
              )}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Tree node ───────────────────────────────────────────────────────────────

interface TreeNodeProps {
  node: ScopeTreeNode
  selected: CommentScope
  onSelect: (s: CommentScope) => void
  collapsed: Set<string>
  onToggle: (key: string) => void
  countFor: (s: CommentScope) => number
  unreadFor: (s: CommentScope) => number
}

function TreeNode({
  node,
  selected,
  onSelect,
  collapsed,
  onToggle,
  countFor,
  unreadFor,
}: TreeNodeProps) {
  const isSelected = scopeEquals(node.scope, selected)
  const isAncestor =
    !isSelected &&
    scopeContains(node.scope, selected) &&
    node.scope.kind !== "global"
  const isOpen = !collapsed.has(node.key)
  const hasChildren = node.children.length > 0
  const count = countFor(node.scope)
  const unread = unreadFor(node.scope)

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "group relative flex h-7 items-center gap-1 rounded px-1.5 text-xs transition-colors",
          isSelected
            ? "bg-accent text-accent-foreground"
            : isAncestor
              ? "text-foreground"
              : unread > 0
                ? "text-foreground hover:bg-accent/50"
                : count > 0
                  ? "text-foreground/70 hover:bg-accent/50 hover:text-foreground"
                  : "text-muted-foreground/50 hover:bg-accent/50 hover:text-muted-foreground"
        )}
      >
        {/* Vivid left bar signals unread — only when not selected */}
        {unread > 0 && !isSelected && (
          <span
            aria-hidden
            className="absolute top-1 bottom-1 left-0 w-0.5 rounded-full bg-primary"
          />
        )}

        {hasChildren && (
          <button
            onClick={() => onToggle(node.key)}
            className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
            aria-label={isOpen ? "Collapse" : "Expand"}
          >
            {isOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        )}

        {node.scope.kind === "global" && (
          <Globe className="mr-1 h-3 w-3 shrink-0 text-muted-foreground" />
        )}

        <button
          onClick={() => onSelect(node.scope)}
          className="min-w-0 flex-1 truncate text-left"
          title={node.label}
        >
          {node.label}
        </button>

        {unread > 0 && (
          <span
            className={cn(
              "shrink-0 text-[10px] font-semibold tabular-nums",
              isSelected ? "text-accent-foreground" : "text-primary"
            )}
          >
            {unread} new
          </span>
        )}
        {unread === 0 && count > 0 && (
          <span className="shrink-0 text-[10px] text-muted-foreground/60 tabular-nums">
            {count}
          </span>
        )}
      </div>

      {hasChildren && isOpen && (
        <div className="ml-3 flex flex-col gap-0.5 border-l border-border pl-1">
          {node.children.map((child) => (
            <TreeNode
              key={child.key}
              node={child}
              selected={selected}
              onSelect={onSelect}
              collapsed={collapsed}
              onToggle={onToggle}
              countFor={countFor}
              unreadFor={unreadFor}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Search filter (keeps ancestors of matches) ──────────────────────────────

function filterTree(nodes: ScopeTreeNode[], q: string): ScopeTreeNode[] {
  if (!q) return nodes
  const out: ScopeTreeNode[] = []
  for (const n of nodes) {
    const childMatches = filterTree(n.children, q)
    const selfMatches = n.label.toLowerCase().includes(q)
    if (selfMatches || childMatches.length > 0) {
      out.push({ ...n, children: childMatches })
    }
  }
  return out
}
