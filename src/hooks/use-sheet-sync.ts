/**
 * useSheetSync
 *
 * Wraps fetchEntireGameDoc / saveEntireGameDoc with React state so the
 * component never has to touch async logic, alert(), or credentials directly.
 *
 * Usage:
 *   const { syncStatus, loadFromSheet, saveToSheet } = useSheetSync(credentials, setDoc)
 */
import { useCallback, useEffect, useRef, useState } from "react"
import type { SteinCredentials } from "./use-stein-creds"
import type { GameDoc } from "@/lib/gamedoc-types"
import { fetchEntireGameDoc, saveEntireGameDoc } from "@/lib/sheet-data"

export type SyncStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "saving" }
  | { state: "success"; message: string }
  | { state: "error"; message: string }

const IDLE: SyncStatus = { state: "idle" }

export function useSheetSync(
  credentials: SteinCredentials | null,
  setDoc: (doc: GameDoc) => void,
  getDoc: () => GameDoc | null
) {
  const [status, setStatus] = useState<SyncStatus>(IDLE)

  // Auto-clear success/error banners after 4 s
  const resetTimer = useRef<number | null>(null)
  useEffect(() => {
    if (status.state !== "success" && status.state !== "error") return
    if (resetTimer.current) window.clearTimeout(resetTimer.current)
    resetTimer.current = window.setTimeout(() => setStatus(IDLE), 4000)
    return () => {
      if (resetTimer.current) window.clearTimeout(resetTimer.current)
    }
  }, [status])

  const loadFromSheet = useCallback(
    async (overrideCredentials?: SteinCredentials) => {
      const creds = overrideCredentials ?? credentials
      if (!creds) {
        setStatus({ state: "error", message: "No credentials provided." })
        return false
      }

      setStatus({ state: "loading" })
      try {
        const fetched = await fetchEntireGameDoc(creds.user, creds.pass)
        if (!fetched) {
          setStatus({
            state: "error",
            message: "Could not load data. Check credentials.",
          })
          return false
        }
        setDoc(fetched)
        setStatus({ state: "success", message: "Loaded from sheet." })
        return true
      } catch (err) {
        setStatus({
          state: "error",
          message: err instanceof Error ? err.message : "Network error.",
        })
        return false
      }
    },
    [credentials, setDoc]
  )

  const saveToSheet = useCallback(
    async (overrideCredentials?: SteinCredentials) => {
      const creds = overrideCredentials ?? credentials
      const doc = getDoc()

      if (!creds) {
        setStatus({ state: "error", message: "No credentials provided." })
        return false
      }
      if (!doc) {
        setStatus({ state: "error", message: "No document to save." })
        return false
      }

      setStatus({ state: "saving" })
      try {
        const result = await saveEntireGameDoc(doc, creds.user, creds.pass)
        if (!result.success) {
          setStatus({
            state: "error",
            message: result.error ?? "Save failed.",
          })
          return false
        }
        setStatus({ state: "success", message: "Saved to sheet." })
        return true
      } catch (err) {
        setStatus({
          state: "error",
          message: err instanceof Error ? err.message : "Network error.",
        })
        return false
      }
    },
    [credentials, getDoc]
  )

  return { syncStatus: status, loadFromSheet, saveToSheet }
}
