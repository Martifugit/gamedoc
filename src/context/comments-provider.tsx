// context/comments-provider.tsx
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  emptyDoc,
  type Comment,
  type CommentScope,
  type Comments,
  type GameDoc,
} from "@/lib/gamedoc-types"
import {
  getSavedAuthor,
  isReadBy,
  matchesFilter,
  saveAuthor,
  scopeContains,
  scopeEquals,
  type FilterKind,
} from "@/lib/comment-utils"
import { useAuth } from "@/hooks/use-auth"

function newId() {
  return Math.random().toString(36).slice(2, 10)
}

interface CommentsContextValue {
  doc: GameDoc
  comments: Comments

  // identity
  author: string
  setAuthor: (name: string) => void

  // authorization
  authorized: boolean
  // alias for authorized
  canDelete: boolean
  requestCredentials: () => Promise<boolean>

  // queries
  rootsForScope: (
    scope: CommentScope | null,
    filter: FilterKind,
    options?: { includeDescendants?: boolean }
  ) => Comment[]
  repliesFor: (id: string) => Comment[]
  openCount: number
  openCountForScope: (
    scope: CommentScope,
    options?: { includeDescendants?: boolean }
  ) => number
  unreadCount: number
  unreadCountForScope: (
    scope: CommentScope,
    options?: { includeDescendants?: boolean }
  ) => number

  // mutations
  addComment: (scope: CommentScope, body: string) => void
  addReply: (parentId: string, body: string) => void
  resolveComment: (id: string) => void
  deleteComment: (id: string) => void
  /** Mark every comment under `scope` as read by the current author. */
  markScopeRead: (
    scope: CommentScope,
    options?: { includeDescendants?: boolean }
  ) => void

  // navigation
  navigateToScope: (scope: CommentScope) => void
}

const CommentsContext = createContext<CommentsContextValue | null>(null)

interface CommentsProviderProps {
  children: ReactNode
  doc: GameDoc | null
  onUpdateComments: (comments: Comments) => void
  credentials: string | null
  saveCredentials: (pw: string) => void
  onNavigateToScope: (scope: CommentScope) => void
  onPromptForPassword: () => Promise<string | null>
}

export function CommentsProvider({
  children,
  doc,
  onUpdateComments,
  credentials,
  saveCredentials,
  onNavigateToScope,
  onPromptForPassword,
}: CommentsProviderProps) {
  const [author, setAuthorState] = useState<string>(getSavedAuthor)

  const hasDoc = !!doc
  const docComments = doc?.comments
  const comments = useMemo(
    () => (hasDoc ? (docComments ?? { items: [] }) : { items: [] }),
    [docComments, hasDoc]
  )

  const setAuthor = useCallback((name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setAuthorState(trimmed)
    saveAuthor(trimmed)
  }, [])

  const mutate = useCallback(
    (fn: (items: Comment[]) => Comment[]) => {
      onUpdateComments({ items: fn(comments.items) })
    },
    [comments.items, onUpdateComments]
  )

  // ── Authorization ──────────────────────────────────────────────────────────

  const authorized = useAuth(credentials)

  const requestCredentials = useCallback(async (): Promise<boolean> => {
    if (credentials) return true
    const pw = await onPromptForPassword()
    if (!pw) return false
    saveCredentials(pw)
    return true
  }, [credentials, onPromptForPassword, saveCredentials])

  // ── Scope matching helper ──────────────────────────────────────────────────

  const matchesScope = useCallback(
    (c: Comment, scope: CommentScope | null, includeDescendants: boolean) => {
      if (!scope) return true
      return includeDescendants
        ? scopeContains(scope, c.scope)
        : scopeEquals(c.scope, scope)
    },
    []
  )

  // ── Queries ────────────────────────────────────────────────────────────────

  const rootsForScope = useCallback(
    (
      scope: CommentScope | null,
      filter: FilterKind,
      options?: { includeDescendants?: boolean }
    ) =>
      comments.items
        .filter((c) => c.parentId === null)
        .filter((c) =>
          matchesScope(c, scope, options?.includeDescendants ?? false)
        )
        .filter((c) => matchesFilter(c, filter))
        .sort((a, b) => b.createdAt - a.createdAt),
    [comments.items, matchesScope]
  )

  const repliesFor = useCallback(
    (id: string) =>
      comments.items
        .filter((c) => c.parentId === id)
        .sort((a, b) => a.createdAt - b.createdAt),
    [comments.items]
  )

  const openCount = useMemo(
    () =>
      comments.items.filter((c) => c.parentId === null && !c.resolved).length,
    [comments.items]
  )

  const openCountForScope = useCallback(
    (scope: CommentScope, options?: { includeDescendants?: boolean }) =>
      comments.items.filter(
        (c) =>
          c.parentId === null &&
          !c.resolved &&
          matchesScope(c, scope, options?.includeDescendants ?? false)
      ).length,
    [comments.items, matchesScope]
  )

  const unreadCount = useMemo(
    () =>
      author ? comments.items.filter((c) => !isReadBy(c, author)).length : 0,
    [comments.items, author]
  )

  const unreadCountForScope = useCallback(
    (scope: CommentScope, options?: { includeDescendants?: boolean }) => {
      if (!author) return 0
      return comments.items.filter(
        (c) =>
          !isReadBy(c, author) &&
          matchesScope(c, scope, options?.includeDescendants ?? false)
      ).length
    },
    [comments.items, author, matchesScope]
  )

  // ── Mutations ──────────────────────────────────────────────────────────────

  const addComment = useCallback(
    (scope: CommentScope, body: string) => {
      const trimmed = body.trim()
      if (!trimmed || !author) return
      mutate((items) => [
        ...items,
        {
          id: newId(),
          parentId: null,
          scope,
          author,
          body: trimmed,
          createdAt: Date.now(),
          resolved: false,
          readBy: [],
        },
      ])
    },
    [author, mutate]
  )

  const addReply = useCallback(
    (parentId: string, body: string) => {
      const trimmed = body.trim()
      if (!trimmed || !author) return
      const parent = comments.items.find((c) => c.id === parentId)
      if (!parent) return
      mutate((items) => [
        ...items,
        {
          id: newId(),
          parentId,
          scope: parent.scope,
          author,
          body: trimmed,
          createdAt: Date.now(),
          resolved: false,
          readBy: [],
        },
      ])
    },
    [author, comments.items, mutate]
  )

  const resolveComment = useCallback(
    (id: string) => {
      mutate((items) =>
        items.map((c) => (c.id === id ? { ...c, resolved: true } : c))
      )
    },
    [mutate]
  )

  const deleteComment = useCallback(
    (id: string) => {
      mutate((items) => items.filter((c) => c.id !== id && c.parentId !== id))
    },
    [mutate]
  )

  const markScopeRead = useCallback(
    (scope: CommentScope, options?: { includeDescendants?: boolean }) => {
      if (!author) return
      const includeDescendants = options?.includeDescendants ?? false
      let changed = false
      const next = comments.items.map((c) => {
        if (!matchesScope(c, scope, includeDescendants)) return c
        if (isReadBy(c, author)) return c
        changed = true
        return { ...c, readBy: [...(c.readBy ?? []), author] }
      })
      if (changed) onUpdateComments({ items: next })
    },
    [author, comments.items, matchesScope, onUpdateComments]
  )

  const value = useMemo<CommentsContextValue>(
    () => ({
      doc: doc || emptyDoc(),
      comments,
      author,
      setAuthor,
      authorized,
      canDelete: authorized,
      requestCredentials,
      rootsForScope,
      repliesFor,
      openCount,
      openCountForScope,
      unreadCount,
      unreadCountForScope,
      addComment,
      addReply,
      resolveComment,
      deleteComment,
      markScopeRead,
      navigateToScope: onNavigateToScope,
    }),
    [
      doc,
      comments,
      author,
      setAuthor,
      authorized,
      requestCredentials,
      rootsForScope,
      repliesFor,
      openCount,
      openCountForScope,
      unreadCount,
      unreadCountForScope,
      addComment,
      addReply,
      resolveComment,
      deleteComment,
      markScopeRead,
      onNavigateToScope,
    ]
  )

  return (
    <CommentsContext.Provider value={value}>
      {children}
    </CommentsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useComments(): CommentsContextValue {
  const ctx = useContext(CommentsContext)
  if (!ctx) {
    throw new Error("useComments must be used within a <CommentsProvider>")
  }
  return ctx
}
