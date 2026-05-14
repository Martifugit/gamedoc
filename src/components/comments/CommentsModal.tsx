// components/comments/CommentsModal.tsx
import { useEffect, useMemo, useState } from "react"
import {
  ChevronDown,
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
  /** Pre-selects a scope in the tree when the modal opens. */
  defaultScope?: CommentScope
}

const FILTERS: FilterKind[] = ["open", "resolved", "all"]

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
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const tree = useMemo(() => buildScopeTree(doc), [doc])

  // Auto-mark visible comments as read as the user focuses a scope.
  useEffect(() => {
    if (!open || !author) return
    const t = setTimeout(() => {
      markScopeRead(selected, { includeDescendants: true })
    }, 600)
    return () => clearTimeout(t)
  }, [open, author, selected, markScopeRead])

  const needsName = !author
  const roots = rootsForScope(selected, filter, { includeDescendants: true })

  const toggle = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  // Filter the visible tree by the search query (matches node label,
  // keeps ancestors of matches).
  const visibleTree = useMemo(
    () => filterTree(tree, query.trim().toLowerCase()),
    [tree, query]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] max-h-[85vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogDescription className="sr-only">
          Manage Comments
        </DialogDescription>
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            Comments
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

          <div className="flex items-center gap-1 pr-8">
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

        {/* ── Two-pane body ───────────────────────────────────────────── */}
        <div className="flex min-h-0 flex-1">
          {/* Left: scope tree */}
          <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-muted/30">
            <div className="relative h-12.25 border-b border-border p-2">
              <Search className="absolute top-1/2 left-4 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search sections…"
                className="h-8 pl-7 text-xs"
              />
            </div>

            <ScrollArea className="min-h-0 flex-1">
              <div className="flex flex-col gap-0.5 p-2">
                {visibleTree.map((node) => (
                  <TreeNode
                    key={node.key}
                    node={node}
                    selected={selected}
                    onSelect={setSelected}
                    collapsed={collapsed}
                    onToggle={toggle}
                    countFor={(s) =>
                      openCountForScope(s, { includeDescendants: true })
                    }
                    unreadFor={(s) =>
                      unreadCountForScope(s, { includeDescendants: true })
                    }
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

          {/* Right: comments + composer */}
          <section className="flex min-w-0 flex-1 flex-col">
            <div className="flex h-12.25 items-center justify-between gap-2 border-b border-border bg-card px-4 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-xs font-semibold text-foreground">
                  {scopeLabel(selected, doc)}
                </span>
                {selected.kind !== "block" && (
                  <span className="text-[10px] text-muted-foreground">
                    includes children
                  </span>
                )}
              </div>

              {selected.kind !== "global" && (
                <button
                  className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setSelected({ kind: "global" })}
                >
                  Reset
                </button>
              )}
              <div
                title={
                  authorized
                    ? "Full comment edit permissions"
                    : "Minimal permissions only"
                }
                className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-px text-[10px] text-accent-foreground/80"
              >
                <Shield
                  size={14}
                  className={authorized ? "text-green-500" : "text-red-500"}
                />
                {authorized ? "Authorized" : "Unauthorized"}
              </div>
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

            {/* Composer: posts to the *exactly* selected scope. No second picker. */}
            <div className="border-t border-border bg-card p-3">
              {needsName ? (
                <AuthorGate />
              ) : !composing ? (
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
              ) : (
                <CommentComposer
                  author={author}
                  autoFocus
                  placeholder={`Comment on ${scopeShortLabel(selected, doc)} as ${author}…`}
                  header={
                    <div className="absolute -top-2 left-2 z-10 flex h-4 items-center gap-1 rounded-none bg-card px-2 text-[10px] text-muted-foreground">
                      Posting to:
                      <span className="font-medium text-foreground">
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
  const open = !collapsed.has(node.key)
  const hasChildren = node.children.length > 0
  const count = countFor(node.scope)
  const unread = unreadFor(node.scope)

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "group flex h-7 items-center gap-1 rounded px-1.5 text-xs transition-colors",
          isSelected
            ? "bg-accent text-accent-foreground"
            : isAncestor
              ? "text-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        )}
      >
        {hasChildren ? (
          <button
            onClick={() => onToggle(node.key)}
            className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
            aria-label={open ? "Collapse" : "Expand"}
          >
            {open ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        ) : (
          <span className="h-4 w-4 shrink-0" />
        )}

        {node.scope.kind === "global" && (
          <Globe className="h-3 w-3 shrink-0 text-muted-foreground" />
        )}

        <button
          onClick={() => onSelect(node.scope)}
          className="min-w-0 flex-1 truncate text-left"
          title={node.label}
        >
          {node.label}
        </button>

        {unread > 0 && (
          <span className="shrink-0 rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground">
            {unread}
          </span>
        )}
        {unread === 0 && count > 0 && (
          <span className="shrink-0 rounded-full bg-muted px-1 text-[9px] font-medium text-muted-foreground">
            {count}
          </span>
        )}
      </div>

      {hasChildren && open && (
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
