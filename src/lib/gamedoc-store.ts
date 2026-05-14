import { get, set } from "idb-keyval"
import { useCallback, useEffect, useRef, useState } from "react"
import { emptyDoc, type GameDoc } from "./gamedoc-types"

const KEY = "gamedoc:v1"

export function useGameDoc() {
  const [doc, setDoc] = useState<GameDoc | null>(null)
  const [loaded, setLoaded] = useState(false)
  const timer = useRef<number | null>(null)

  const clearCurrentDoc = useCallback(() => {
    if (!doc) return
    setDoc({
      title: doc?.title ?? "New Document",
      sections: [],
      updatedAt: Date.now(),
    })
    localStorage.removeItem(KEY)
  }, [setDoc, doc])

  useEffect(() => {
    ;(async () => {
      try {
        const stored = (await get(KEY)) as GameDoc | undefined
        setDoc(stored ?? emptyDoc())
      } catch {
        try {
          const ls = localStorage.getItem(KEY)
          setDoc(ls ? (JSON.parse(ls) as GameDoc) : emptyDoc())
        } catch {
          setDoc(emptyDoc())
        }
      }
      setLoaded(true)
    })()
  }, [])

  useEffect(() => {
    if (!loaded || !doc) return
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      const toSave = { ...doc, updatedAt: Date.now() }
      set(KEY, toSave).catch(() => {
        try {
          localStorage.setItem(KEY, JSON.stringify(toSave))
        } catch {
          console.error("Something went wrong syncing")
        }
      })
    }, 400)
  }, [doc, loaded])

  return { doc, setDoc, clearCurrentDoc, loaded }
}
