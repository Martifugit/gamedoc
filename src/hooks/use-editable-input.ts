// hooks/useEditableInput.ts
import { editorToolbar } from "@/lib/EditorToolbar"
import { useCallback, useEffect, useRef } from "react"

export function useEditorInput<
  T extends HTMLInputElement | HTMLTextAreaElement,
>(externalRef?: React.RefCallback<T>) {
  const ref = useRef<T>(null)
  const handleBlur = () => editorToolbar.scheduleUnregister()

  const insertRef = useRef((text: string) => {
    const el = ref.current
    if (!el) return

    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? el.value.length
    const newValue = el.value.slice(0, start) + text + el.value.slice(end)

    const proto =
      el instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, newValue)

    el.dispatchEvent(new Event("input", { bubbles: true }))
    el.focus()
    el.setSelectionRange(start + text.length, start + text.length)
  })

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const handleFocus = () => {
      editorToolbar.register(insertRef.current, el)
    }

    const handleClick = () => {
      editorToolbar.updatePosition(el)
    }

    const handleKeyUp = () => {
      editorToolbar.updatePosition(el)
    }

    el.addEventListener("focus", handleFocus)
    el.addEventListener("blur", handleBlur)
    el.addEventListener("click", handleClick)
    el.addEventListener("keyup", handleKeyUp)

    return () => {
      el.removeEventListener("focus", handleFocus)
      el.removeEventListener("blur", handleBlur)
      el.removeEventListener("click", handleClick)
      el.removeEventListener("keyup", handleKeyUp)
      editorToolbar.unregister()
    }
  }, [])

  const mergedRef = useCallback(
    (el: T | null) => {
      ref.current = el
      externalRef?.(el)
    },
    [externalRef]
  )

  return mergedRef
}
