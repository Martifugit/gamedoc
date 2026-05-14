// components/comments/CommentPieces.tsx
import { useState } from "react"
import {
  Reply,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Trash2,
  CornerUpRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { type Comment } from "@/lib/gamedoc-types"
import { formatTime, scopeLabel } from "@/lib/comment-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useComments } from "@/context/comments-provider"

// ── AuthorGate ───────────────────────────────────────────────────────────────

export function AuthorGate() {
  const { setAuthor } = useComments()
  const [name, setName] = useState("")
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-xs text-muted-foreground">
        Enter your name to leave a comment.
      </p>
      <div className="flex gap-2">
        <Input
          autoFocus
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) setAuthor(name)
          }}
          className="h-8 text-xs"
        />
        <Button
          size="sm"
          className="h-8 shrink-0 text-xs"
          disabled={!name.trim()}
          onClick={() => setAuthor(name)}
        >
          Continue
        </Button>
      </div>
    </div>
  )
}

// ── CommentComposer ──────────────────────────────────────────────────────────
// A bare textarea + actions. Scope selection is owned by the parent, so this
// works for both the global modal and the scoped popover.

interface CommentComposerProps {
  author: string
  placeholder?: string
  autoFocus?: boolean
  /** Optional node rendered above the textarea (e.g. a scope picker). */
  header?: React.ReactNode
  submitLabel?: string
  onSubmit: (body: string) => void
  onCancel: () => void
}

export function CommentComposer({
  author,
  placeholder,
  autoFocus,
  header,
  submitLabel = "Comment",
  onSubmit,
  onCancel,
}: CommentComposerProps) {
  const [body, setBody] = useState("")

  const submit = () => {
    const trimmed = body.trim()
    if (!trimmed) return
    onSubmit(trimmed)
    setBody("")
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        {header}
        <Textarea
          autoFocus={autoFocus}
          placeholder={placeholder ?? `Comment as ${author}…`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit()
            if (e.key === "Escape") onCancel()
          }}
          className="min-h-0 resize-none bg-transparent! text-xs!"
          rows={3}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to submit · <kbd>Esc</kbd> to cancel
        </span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            disabled={!body.trim()}
            onClick={submit}
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── CommentRow ───────────────────────────────────────────────────────────────

interface CommentRowProps {
  comment: Comment
  /** Show the scope chip + "Go to" affordance. Off inside the scoped popover. */
  showScope?: boolean
  /** Start with replies collapsed. */
  defaultCollapsed?: boolean
}

export function CommentRow({
  comment,
  showScope = true,
  defaultCollapsed = false,
}: CommentRowProps) {
  const {
    doc,
    author,
    repliesFor,
    addReply,
    resolveComment,
    deleteComment,
    canDelete,
    requestCredentials,
    navigateToScope,
  } = useComments()

  const replies = repliesFor(comment.id)
  const [expanded, setExpanded] = useState(!defaultCollapsed)
  const [replying, setReplying] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const handleDelete = async () => {
    // Stored credential is enough; prompt only if it's missing.
    const ok = await requestCredentials()
    if (!ok) return
    deleteComment(comment.id)
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-card text-sm transition-opacity",
        comment.resolved && "opacity-50"
      )}
    >
      {/* Top-level comment */}
      <div className="flex flex-col gap-1.5 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary uppercase">
              {comment.author[0]}
            </span>
            <span className="truncate text-xs font-medium">
              {comment.author}
            </span>
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {formatTime(comment.createdAt)}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            {!comment.resolved && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                title="Mark resolved"
                onClick={() => resolveComment(comment.id)}
              >
                <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                title="Delete comment"
                onClick={() => setConfirmingDelete(true)}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </Button>
            )}
            {replies.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setExpanded((p) => !p)}
              >
                {expanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </Button>
            )}
          </div>
        </div>

        <p className="text-xs leading-relaxed text-foreground/90">
          {comment.body}
        </p>

        {/* Inline delete confirmation */}
        {confirmingDelete ? (
          <div className="flex items-center justify-between gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-2 py-1.5">
            <span className="text-[10px] text-muted-foreground">
              Delete this comment{replies.length > 0 ? " and its replies" : ""}?
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px]"
                onClick={() => setConfirmingDelete(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-6 px-2 text-[10px]"
                onClick={() => {
                  setConfirmingDelete(false)
                  void handleDelete()
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {showScope && (
              <button
                className="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
                title={`Go to ${scopeLabel(comment.scope, doc)}`}
                onClick={() => navigateToScope(comment.scope)}
              >
                {scopeLabel(comment.scope, doc)}
                {comment.scope.kind !== "global" && (
                  <CornerUpRight className="h-2.5 w-2.5" />
                )}
              </button>
            )}
            {!comment.resolved && (
              <button
                className="flex items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setReplying((p) => !p)}
              >
                <Reply className="h-3 w-3" />
                Reply
              </button>
            )}
            {comment.resolved && (
              <span className="text-[10px] text-emerald-500">Resolved</span>
            )}
          </div>
        )}
      </div>

      {/* Reply compose */}
      {replying && (
        <div className="flex flex-col gap-2 border-t border-border/50 px-3 pt-2 pb-3">
          <CommentComposer
            author={author}
            autoFocus
            placeholder={`Reply as ${author}…`}
            submitLabel="Reply"
            onSubmit={(b) => {
              addReply(comment.id, b)
              setReplying(false)
            }}
            onCancel={() => setReplying(false)}
          />
        </div>
      )}

      {/* Replies */}
      {expanded && replies.length > 0 && (
        <div className="flex flex-col gap-0 border-t border-border/50">
          {replies.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-1 border-b border-border/30 px-3 py-2 last:border-b-0"
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-semibold uppercase">
                    {r.author[0]}
                  </span>
                  <span className="text-[11px] font-medium">{r.author}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatTime(r.createdAt)}
                  </span>
                </div>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    title="Delete reply"
                    onClick={async () => {
                      const ok = await requestCredentials()
                      if (ok) deleteComment(r.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </Button>
                )}
              </div>
              <p className="pl-5 text-xs leading-relaxed text-foreground/80">
                {r.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
