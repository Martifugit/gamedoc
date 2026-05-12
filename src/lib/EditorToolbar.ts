// lib/editor-toolbar.ts
export type EditorToolbarInsert = (text: string) => void
import getCaretCoordinates from "textarea-caret"

export interface EditorToolbarState {
  insert: EditorToolbarInsert | null
  position: { x: number; y: number } | null
  isOpen: boolean
}

type Listener = (state: EditorToolbarState) => void

class EditorToolbarManager {
  private insertFn: EditorToolbarInsert | null = null
  private position: { x: number; y: number } | null = null
  private isOpen = false
  private listeners: Set<Listener> = new Set()
  private element: HTMLElement | null = null
  private blurTimer: ReturnType<typeof setTimeout> | null = null
  private scrollOrigin: number | null = null
  private readonly SCROLL_THRESHOLD = 50

  register(insertFn: EditorToolbarInsert, element: HTMLElement) {
    if (this.blurTimer) {
      clearTimeout(this.blurTimer)
      this.blurTimer = null
    }
    this.insertFn = insertFn
    this.element = element
    this.updatePosition(element)
    this.notify()
  }

  unregister() {
    if (this.isOpen) {
      this.close()
    }
    this.insertFn = null
    this.element = null
    this.position = null
    this.notify()
  }

  scheduleUnregister() {
    this.blurTimer = setTimeout(() => {
      const active = document.activeElement
      const inToolbar = active?.closest("[data-editor-toolbar]")
      const inPopover = active?.closest("[data-radix-popover-content]")
      if (!inToolbar && !inPopover) {
        this.unregister()
      }
    }, 100)
  }

  onScroll() {
    const scrollY = window.scrollY
    if (this.scrollOrigin === null) {
      this.scrollOrigin = scrollY
      return
    }
    if (Math.abs(scrollY - this.scrollOrigin) > this.SCROLL_THRESHOLD) {
      this.scrollOrigin = null
      this.close()
    }
  }

  updatePosition(element: HTMLElement) {
    const rect = element.getBoundingClientRect()

    if (
      element instanceof HTMLTextAreaElement ||
      (element instanceof HTMLInputElement && element.type === "text")
    ) {
      const pos = element.selectionStart ?? 0
      const caret = getCaretCoordinates(element, pos)
      this.position = {
        x: rect.left + caret.left,
        y: rect.top + caret.top + caret.height + 5,
      }
    } else {
      // Fallback for contenteditable or anything else
      this.position = {
        x: rect.left + 10,
        y: rect.bottom + 5,
      }
    }

    this.notify()
  }

  open() {
    if (this.insertFn && this.position) {
      this.isOpen = true
      this.scrollOrigin = window.scrollY
      this.notify()
    }
  }

  close() {
    this.isOpen = false
    this.notify()
  }

  toggle() {
    console.log("Toggle called, current state:", this.isOpen)
    if (this.isOpen) {
      this.close()
    } else {
      if (this.element) {
        this.updatePosition(this.element)
      }
      this.open()
    }
  }

  getState(): EditorToolbarState {
    return {
      insert: this.insertFn,
      position: this.position,
      isOpen: this.isOpen,
    }
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify() {
    const state = this.getState()
    this.listeners.forEach((listener) => listener(state))
  }
}

export const editorToolbar = new EditorToolbarManager()
