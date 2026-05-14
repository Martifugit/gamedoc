// components/comments/CommentsPopover.tsx
import { useState, type ReactNode } from "react"
import { MessageSquare } from "lucide-react"
import { type CommentScope } from "@/lib/gamedoc-types"
import { scopeShortLabel } from "@/lib/comment-utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AuthorGate, CommentComposer, CommentRow } from "./CommentsPieces"
import { useComments } from "@/context/comments-provider"
import { cn } from "@/lib/utils"

interface CommentsPopoverProps {
  scope: CommentScope
  /** The trigger element — e.g. a small icon button in a Container header. */
  children?: ReactNode
  triggerClassName?: string
}

/**
 * Lightweight, scope-locked comment view. Shows only comments whose scope
 * exactly matches `scope` (no descendants), plus a compact composer that
 * always posts into this exact scope.
 */
export function CommentsPopover({
  scope,
  triggerClassName,
  children,
}: CommentsPopoverProps) {
  const { doc, author, rootsForScope, addComment, openCountForScope } =
    useComments()

  const [open, setOpen] = useState(false)
  const [composing, setComposing] = useState(false)

  // Scoped popover always shows everything for this scope (open + resolved).
  const roots = rootsForScope(scope, "all")
  const count = openCountForScope(scope)
  const needsName = !author

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children ?? (
          <Button
            className={cn(triggerClassName, "relative")}
            variant="ghost"
            size="sm"
            title="Comments"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-0.5 text-[8px] font-semibold text-primary-foreground">
                {count}
              </span>
            )}
          </Button>
        )}
      </PopoverTrigger>

      <PopoverContent
        className="flex max-h-[60vh] w-80 flex-col gap-0 overflow-hidden p-0"
        align="end"
      >
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate text-xs font-semibold">
            {scopeShortLabel(scope, doc)}
          </span>
          {count > 0 && (
            <span className="ml-auto shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              {count} open
            </span>
          )}
        </div>

        {/* Thread list — no scope chip, no "go to": already in context */}
        <ScrollArea className="min-h-0 flex-1 overflow-hidden">
          <div className="space-y-2 p-3">
            {roots.length === 0 && (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No comments here yet.
              </p>
            )}
            {roots.map((c) => (
              <CommentRow key={c.id} comment={c} showScope={false} />
            ))}
          </div>
        </ScrollArea>

        {/* Compose */}
        <div className="border-t border-border p-3">
          {needsName ? (
            <AuthorGate />
          ) : !composing ? (
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-full justify-start text-xs text-muted-foreground"
              onClick={() => setComposing(true)}
            >
              <MessageSquare className="mr-2 h-3 w-3" />
              Add a comment…
            </Button>
          ) : (
            <CommentComposer
              author={author}
              autoFocus
              onSubmit={(body) => {
                addComment(scope, body)
                setComposing(false)
              }}
              onCancel={() => setComposing(false)}
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
