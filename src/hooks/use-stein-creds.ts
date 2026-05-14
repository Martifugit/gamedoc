/**
 * useSteinCredentials
 *
 * Single source of truth for Stein Basic-auth credentials.
 * Persists to localStorage so they survive page reloads.
 */
import { useCallback, useState } from "react"

const USER_KEY = "stein_user"
const PASS_KEY = "stein_pass"

export type SteinCredentials = { user: string; pass: string }

function readCredentials(): SteinCredentials | null {
  const user = localStorage.getItem(USER_KEY)
  const pass = localStorage.getItem(PASS_KEY)
  return user && pass ? { user, pass } : null
}

export function useSteinCredentials() {
  const [credentials, setCredentialsState] = useState<SteinCredentials | null>(
    () => readCredentials()
  )

  const saveCredentials = useCallback((user: string, pass: string) => {
    localStorage.setItem(USER_KEY, user)
    localStorage.setItem(PASS_KEY, pass)
    setCredentialsState({ user, pass })
  }, [])

  const clearCredentials = useCallback(() => {
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(PASS_KEY)
    setCredentialsState(null)
  }, [])

  return { credentials, saveCredentials, clearCredentials }
}
