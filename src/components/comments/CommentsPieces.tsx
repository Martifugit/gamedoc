// components/comments/CommentPieces.tsx
import { useState } from "react"
import {
  Reply,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Trash2,
  ArrowUpRight,
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
  placeholder,
  autoFocus,
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
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-background">
      {/* Textarea */}
      <Textarea
        autoFocus={autoFocus}
        placeholder={placeholder ?? `Share your thoughts…`}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit()
          if (e.key === "Escape") onCancel()
        }}
        className="min-h-18 resize-none rounded-none border-0 bg-muted/15! text-[13px] shadow-none focus-visible:ring-0"
        rows={4}
      />

      {/* Bottom chrome — hints + actions */}
      <div className="flex items-center justify-end bg-muted/15 py-1.5 pr-2 pl-3 md:justify-between">
        <span className="hidden text-[11px] text-muted-foreground md:block">
          <kbd className="rounded border border-border bg-background p-1 font-mono text-[10px]">
            Ctrl+Enter
          </kbd>{" "}
          to submit ·{" "}
          <kbd className="rounded border border-border bg-background p-1 font-mono text-[10px]">
            Esc
          </kbd>{" "}
          to cancel
        </span>
        <div className="flex items-center gap-1.5">
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

// ── CommentRow ───────────────────────────────────────────────────────────────

interface CommentRowProps {
  comment: Comment
  showScope?: boolean
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
    const ok = await requestCredentials()
    if (!ok) return
    deleteComment(comment.id)
  }

  return (
    <div
      className={cn(
        "group/card rounded-lg border border-border/60 bg-card text-sm transition-all",
        comment.resolved && "border-border/30 bg-card/50"
      )}
    >
      {/* ── Root comment ── */}
      <div className="flex flex-col gap-2 p-3">
        {/* Header row: avatar + meta + action toolbar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar author={comment.author} />
            <span
              className={cn(
                "truncate text-xs font-semibold",
                comment.resolved && "text-muted-foreground"
              )}
            >
              {comment.author}
            </span>
            <span className="shrink-0 text-[10px] text-muted-foreground/60 tabular-nums">
              {formatTime(comment.createdAt)}
            </span>
            {comment.resolved && (
              <span className="shrink-0 rounded-full bg-emerald-500/10 px-1.5 py-px text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                Resolved
              </span>
            )}
          </div>

          {/* Action toolbar — mirrors the toolbar aesthetic: grouped, housed */}
          {(!comment.resolved || replies.length > 0 || canDelete) && (
            <div className="flex shrink-0 items-center gap-px rounded-md border border-border/60 bg-muted/60 p-0.5 opacity-0 shadow-sm transition-opacity group-hover/card:opacity-100">
              {!comment.resolved && (
                <IconAction
                  label="Mark resolved"
                  onClick={() => resolveComment(comment.id)}
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                </IconAction>
              )}
              {replies.length > 0 && (
                <IconAction
                  label={expanded ? "Collapse replies" : "Expand replies"}
                  onClick={() => setExpanded((p) => !p)}
                >
                  {expanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </IconAction>
              )}
              {canDelete && (
                <>
                  {/* Separator before destructive action */}
                  <span
                    className="mx-0.5 h-3.5 w-px bg-border/60"
                    aria-hidden
                  />
                  <IconAction
                    label="Delete comment"
                    onClick={() => setConfirmingDelete(true)}
                    destructive
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </IconAction>
                </>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        <p
          className={cn(
            "text-xs leading-relaxed",
            comment.resolved ? "text-muted-foreground" : "text-foreground/90"
          )}
        >
          {comment.body}
        </p>

        {/* Footer row: scope chip + reply */}
        {!confirmingDelete ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {showScope && (
                <button
                  className="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
                  title={`Go to ${scopeLabel(comment.scope, doc)}`}
                  onClick={() => navigateToScope(comment.scope)}
                >
                  {`Go To: ${scopeLabel(comment.scope, doc)}`}
                  <ArrowUpRight className="h-3 w-3" />
                </button>
              )}
            </div>
            {!comment.resolved && (
              <button
                className="flex items-center gap-1 text-[10px] text-muted-foreground/60 transition-colors hover:text-foreground"
                onClick={() => setReplying((p) => !p)}
              >
                <Reply className="h-3 w-3" />
                Reply
              </button>
            )}
          </div>
        ) : (
          /* Inline delete confirmation */
          <div className="flex items-center justify-between gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-1.5">
            <span className="text-[10px] text-muted-foreground">
              Delete{replies.length > 0 ? " comment and replies" : ""}?
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
        )}
      </div>

      {/* ── Reply composer ── */}
      {replying && (
        <div className="border-t border-border/50 px-3 pt-2 pb-3">
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

      {/* ── Replies ── */}
      {expanded && replies.length > 0 && (
        <div className="border-t border-border/50">
          {replies.map((r, i) => (
            <div
              key={r.id}
              className={cn(
                "flex flex-col gap-1.5 px-3 py-2",
                i < replies.length - 1 && "border-b border-border/30"
              )}
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-2">
                  <Avatar author={r.author} size="sm" />
                  <span className="text-[11px] font-semibold">{r.author}</span>
                  <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                    {formatTime(r.createdAt)}
                  </span>
                </div>
                {canDelete && (
                  <div className="opacity-0 transition-opacity group-hover/card:opacity-100">
                    <IconAction
                      label="Delete reply"
                      onClick={async () => {
                        const ok = await requestCredentials()
                        if (ok) deleteComment(r.id)
                      }}
                      destructive
                    >
                      <Trash2 className="h-3 w-3" />
                    </IconAction>
                  </div>
                )}
              </div>
              <p className="pl-6 text-xs leading-relaxed text-foreground/80">
                {r.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Avatar ──────────────────────────────────────────────────────────────────
// Single source of truth for author avatars — eliminates the size inconsistency
// between root comments (h-5 w-5) and replies (h-4 w-4).

interface AvatarProps {
  author: string
  size?: "sm" | "md"
}

function Avatar({ author, size = "md" }: AvatarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary uppercase",
        size === "md" ? "h-6 w-6 text-[11px]" : "h-5 w-5 text-[10px]"
      )}
    >
      <span className="leading-0">{author[0]}</span>
    </div>
  )
}

// ── IconAction ──────────────────────────────────────────────────────────────
// Consistent icon button used in the action toolbar — gives icons a housed,
// pressable feel rather than floating ghost buttons.

interface IconActionProps {
  label: string
  onClick: () => void
  destructive?: boolean
  children: React.ReactNode
}

function IconAction({
  label,
  onClick,
  destructive,
  children,
}: IconActionProps) {
  return (
    <button
      title={label}
      onClick={onClick}
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded transition-colors",
        destructive
          ? "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          : "text-muted-foreground hover:bg-background hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}
