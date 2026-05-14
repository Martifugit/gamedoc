import { useEffect, useState } from "react"

export function useIsStuck(
  ref: React.RefObject<HTMLElement | null>,
  offset = 16
) {
  const [isStuck, setIsStuck] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setIsStuck(
        (ref.current?.getBoundingClientRect().top ?? Infinity) <= offset
      )
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [ref, offset])

  return isStuck
}
