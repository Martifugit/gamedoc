// components/comments/CommentsHost.tsx
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react"
import {
  type Comments,
  type CommentScope,
  type GameDoc,
} from "@/lib/gamedoc-types"
import { scopeToElementId } from "@/lib/comment-utils"
import { PasswordPromptDialog } from "./PasswordPromptDialog"
import {
  createScopeHighlightBus,
  ScopeHighlightBusProvider,
} from "@/hooks/use-scope-highlight"
import { CommentsProvider } from "@/context/comments-provider"

interface CommentsHostProps {
  children: ReactNode
  doc: GameDoc | null
  onUpdateComments: (comments: Comments) => void
  credentials: string | null
  saveCredentials: (pw: string) => void
  /** Called right before scrolling — use to close the global modal. */
  onBeforeNavigate?: () => void
}

/**
 * Single integration point for the comments feature. Wrap the part of the
 * app that needs comment access (in practice, the whole editor) in this.
 *
 * It owns:
 *  - the CommentsProvider (state + mutations)
 *  - the password prompt dialog (shown on delete when no credential stored)
 *  - scroll-to-scope navigation (mirrors the table-of-contents behaviour)
 */
export function CommentsHost({
  children,
  doc,
  onUpdateComments,
  credentials,
  saveCredentials,
  onBeforeNavigate,
}: CommentsHostProps) {
  // ── Password prompt plumbing ───────────────────────────────────────────────
  const [pwOpen, setPwOpen] = useState(false)
  const pwResolverRef = useRef<((pw: string | null) => void) | null>(null)

  const onPromptForPassword = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      pwResolverRef.current = resolve
      setPwOpen(true)
    })
  }, [])

  const handlePwResolve = useCallback((pw: string | null) => {
    setPwOpen(false)
    pwResolverRef.current?.(pw)
    pwResolverRef.current = null
  }, [])

  // ── Navigation ─────────────────────────────────────────────────────────────
  // One bus instance per host. Leaf components subscribe via useScopeHighlight.
  const highlightBus = useMemo(() => createScopeHighlightBus(), [])

  const onNavigateToScope = useCallback(
    (scope: CommentScope) => {
      const id = scopeToElementId(scope)
      onBeforeNavigate?.()
      // Defer so a closing modal can unmount before we measure/scroll.
      setTimeout(() => {
        if (id) {
          const el = document.getElementById(id)
          if (el) el.scrollIntoView({ block: "start", behavior: "smooth" })
        }
        // Flash the target even for global scope (no-op if nothing subscribed).
        highlightBus.emit(scope)
      }, 60)
    },
    [onBeforeNavigate, highlightBus]
  )

  return (
    <ScopeHighlightBusProvider value={highlightBus}>
      <CommentsProvider
        doc={doc}
        onUpdateComments={onUpdateComments}
        credentials={credentials}
        saveCredentials={saveCredentials}
        onNavigateToScope={onNavigateToScope}
        onPromptForPassword={onPromptForPassword}
      >
        {children}
        <PasswordPromptDialog open={pwOpen} onResolve={handlePwResolve} />
      </CommentsProvider>
    </ScopeHighlightBusProvider>
  )
}
