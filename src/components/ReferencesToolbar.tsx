// components/EditorToolbar.tsx
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { InsertLinkPopover } from "./InsertLinkPopover"
import { ReferencePicker } from "./ReferencePicker"
import { VariablePicker } from "./VariablePicker"
import { formatVariableReference } from "@/lib/reference-syntax"
import type { Section } from "@/lib/gamedoc-types"
import { editorToolbar } from "@/lib/EditorToolbar"
import type { PickerHandle } from "@/lib/types"
import { cn } from "@/lib/utils"

export function ReferencesToolbar({
  allSections,
  currentSectionId,
}: {
  allSections: Section[]
  currentSectionId?: string
}) {
  const [state, setState] = useState(() => editorToolbar.getState())

  const insetLinkPopoverRef = useRef<PickerHandle>(null)
  const referencesPopoverRef = useRef<PickerHandle>(null)
  const variablesPopoverRef = useRef<PickerHandle>(null)

  useEffect(() => {
    return editorToolbar.subscribe(setState)
  }, [])

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.code === "Digit1") {
        insetLinkPopoverRef?.current?.open()
      }
      if (e.code === "Digit2") {
        referencesPopoverRef?.current?.open()
      }
      if (e.code === "Digit3") {
        variablesPopoverRef?.current?.open()
      }
      if ((e.ctrlKey || e.metaKey) && e.code === "Space") {
        e.preventDefault()
        console.log("TRIGGERED")
        editorToolbar.toggle()
      }

      // Close on Escape
      if (e.code === "Escape") {
        editorToolbar.close()
      }
    }

    const handleScroll = () => {
      if (editorToolbar.getState().isOpen) {
        editorToolbar.close()
      }
    }

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement

      const isToolbar = target.closest("[data-editor-toolbar]")
      const isPopoverContent = target.closest("[data-radix-popover-content]")
      const isPopoverTrigger = target.closest("[data-radix-popover-trigger]")

      if (!isToolbar && !isPopoverContent && !isPopoverTrigger) {
        editorToolbar.close()
      }
    }

    // Listeners

    window.addEventListener("keydown", handleKeydown)
    window.addEventListener("scroll", handleScroll, {
      capture: true,
      passive: true,
    })

    document.addEventListener("mousedown", handleMouseDown)

    return () => {
      window.removeEventListener("keydown", handleKeydown)
      window.removeEventListener("scroll", handleScroll, {
        capture: true,
      })
      document.removeEventListener("mousedown", handleMouseDown)
    }
  }, [])

  const insert = (text: string) => {
    state.insert?.(text)
    editorToolbar.close()
  }

  if (!state.isOpen || !state.insert || !state.position) return null

  return createPortal(
    <div
      data-editor-toolbar
      className={cn(
        "fixed z-50 flex gap-1 rounded-lg border border-border bg-popover p-1 shadow-lg shadow-black/70"
      )}
      style={{
        transform: "translateX(-50%)",
        left: state?.position ? state.position.x : 0,
        top: state?.position ? state.position.y : 0,
      }}
    >
      <InsertLinkPopover ref={insetLinkPopoverRef} onInsert={insert} />
      <ReferencePicker
        currentSectionId={currentSectionId}
        ref={referencesPopoverRef}
        allSections={allSections}
        onPick={(ref) => insert(ref)}
      />
      <VariablePicker
        currentSectionId={currentSectionId}
        ref={variablesPopoverRef}
        allSections={allSections}
        onPick={(id, name) => insert(formatVariableReference(id, name))}
      />
    </div>,
    document.body
  )
}
