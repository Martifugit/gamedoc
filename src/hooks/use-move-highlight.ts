// hooks/use-move-highlight.ts
import { useEffect, useRef, useState } from "react"

export function useMoveHighlight<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [highlightMoved, setHighlightMoved] = useState(false)

  const triggerMove = () => setHighlightMoved(true)

  useEffect(() => {
    if (!highlightMoved) return

    const highlightHandle = setTimeout(() => setHighlightMoved(false), 600)
    const scrollHandle = setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 50)

    return () => {
      clearTimeout(highlightHandle)
      clearTimeout(scrollHandle)
    }
  }, [highlightMoved])

  return { ref, highlightMoved, triggerMove }
}
