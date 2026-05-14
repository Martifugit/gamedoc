import { useCallback, useEffect, useRef, useState } from "react"
import type { GameDoc } from "@/lib/gamedoc-types"
import { loadGameDoc, saveGameDoc } from "@/lib/mongo-data"

export type SyncStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "saving" }
  | { state: "success"; message: string }
  | { state: "error"; message: string }

const IDLE: SyncStatus = { state: "idle" }

export function useDbSync(
  pw: string | null,
  setDoc: (doc: GameDoc) => void,
  getDoc: () => GameDoc | null
) {
  const [status, setStatus] = useState<SyncStatus>(IDLE)

  const resetTimer = useRef<number | null>(null)
  useEffect(() => {
    if (status.state !== "success" && status.state !== "error") return
    if (resetTimer.current) window.clearTimeout(resetTimer.current)
    resetTimer.current = window.setTimeout(() => setStatus(IDLE), 4000)
    return () => {
      if (resetTimer.current) window.clearTimeout(resetTimer.current)
    }
  }, [status])

  const loadFromDb = useCallback(
    async (overrideCredentials?: string) => {
      const creds = overrideCredentials ?? pw
      if (!creds) {
        setStatus({ state: "error", message: "No credentials provided." })
        return false
      }

      setStatus({ state: "loading" })
      try {
        const fetched = await loadGameDoc(creds)
        if (!fetched) {
          setStatus({
            state: "error",
            message: "No document found. Save first to create it.",
          })
          return false
        }
        setDoc(fetched)
        setStatus({ state: "success", message: "Loaded from database." })
        return true
      } catch (err) {
        setStatus({
          state: "error",
          message: err instanceof Error ? err.message : "Network error.",
        })
        return false
      }
    },
    [pw, setDoc]
  )

  const saveToDb = useCallback(
    async (overrideCredentials?: string) => {
      const creds = overrideCredentials ?? pw
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
        await saveGameDoc(doc, creds)
        setStatus({ state: "success", message: "Saved to database." })
        return true
      } catch (err) {
        setStatus({
          state: "error",
          message: err instanceof Error ? err.message : "Network error.",
        })
        return false
      }
    },
    [pw, getDoc]
  )

  return { syncStatus: status, loadFromDb, saveToDb }
}
