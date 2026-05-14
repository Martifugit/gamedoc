import { createContext, useContext, useEffect, useState } from "react"
import { type CommentScope } from "@/lib/gamedoc-types"
import { scopeToValue } from "@/lib/comment-utils"

/**
 * A tiny pub/sub bridging "go to comment" navigation and the target element.
 *
 * The problem: `useMoveHighlight` works because a section owns both its ref
 * and its highlight state. Comment navigation is the opposite — the trigger
 * lives in CommentsHost and the target is some far-away component, known only
 * by its scope. So instead of lifting state, the target *subscribes* to its
 * own scope, and the host *emits* a scope to flash.
 *
 * `CommentsHost` creates one of these and:
 *   - passes `emit` into the provider's navigation handler
 *   - nothing else — subscription happens in the leaf components.
 *
 * Section / Container / Block views call `useScopeHighlight(scope)` and get
 * back `{ ref, highlight }`, same shape as `useMoveHighlight`.
 */

type Listener = () => void

export interface ScopeHighlightBus {
  /** Flash the element registered for this scope. */
  emit: (scope: CommentScope) => void
  /** Internal: subscribe a listener to a scope value. Returns unsubscribe. */
  subscribe: (scopeValue: string, fn: Listener) => () => void
}

export function createScopeHighlightBus(): ScopeHighlightBus {
  const listeners = new Map<string, Set<Listener>>()

  return {
    emit(scope) {
      const key = scopeToValue(scope)
      listeners.get(key)?.forEach((fn) => fn())
    },
    subscribe(scopeValue, fn) {
      let set = listeners.get(scopeValue)
      if (!set) {
        set = new Set()
        listeners.set(scopeValue, set)
      }
      set.add(fn)
      return () => {
        set!.delete(fn)
        if (set!.size === 0) listeners.delete(scopeValue)
      }
    },
  }
}

/** How long the highlight stays on. Matches useMoveHighlight (600ms). */
const HIGHLIGHT_MS = 600

/**
 * Subscribe an element to comment-navigation highlights for `scope`.
 *
 * Deliberately does NOT own a ref. A DOM node can only take one `ref`, and on
 * sections/containers that slot is already used by `useMoveHighlight`. This
 * hook returns only the flash flag, so the two compose freely:
 *
 *   const { ref, highlightMoved } = useMoveHighlight()
 *   const { highlight: highlightComment } = useScopeHighlight({
 *     kind: "section",
 *     sectionId: section.id,
 *   })
 *   <section
 *     ref={ref}
 *     className={cn(
 *       (highlightMoved || highlightComment) && "ring-2 ring-primary ..."
 *     )}
 *   />
 *
 * Scrolling is handled by CommentsHost's navigateToScope, so this hook never
 * needs the element node — only to know when to flash.
 */
export function useScopeHighlight(scope: CommentScope, duration?: number) {
  const [highlight, setHighlight] = useState(false)
  const bus = useScopeHighlightBus()

  // Re-subscribe whenever the scope identity changes.
  const scopeValue = scopeToValue(scope)

  useEffect(() => {
    if (!bus) return
    return bus.subscribe(scopeValue, () => setHighlight(true))
  }, [bus, scopeValue])

  useEffect(() => {
    if (!highlight) return
    const handle = setTimeout(
      () => setHighlight(false),
      duration ?? HIGHLIGHT_MS
    )
    return () => clearTimeout(handle)
  }, [highlight, duration])

  return { highlight }
}

// ── Bus context ──────────────────────────────────────────────────────────────
// Kept here (not in CommentsContext) so leaf components can subscribe without
// pulling in the whole comments value — and so the bus is available even if a
// component sits outside the data provider but inside the host.

const ScopeHighlightBusContext = createContext<ScopeHighlightBus | null>(null)

export const ScopeHighlightBusProvider = ScopeHighlightBusContext.Provider

export function useScopeHighlightBus(): ScopeHighlightBus | null {
  return useContext(ScopeHighlightBusContext)
}
