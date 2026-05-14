// components/comments/PasswordPromptDialog.tsx
import { useState } from "react"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface PasswordPromptDialogProps {
  open: boolean
  /** Called with the entered password, or null if cancelled. */
  onResolve: (password: string | null) => void
}

/**
 * Minimal password gate. Drives the `onPromptForPassword` prop of
 * <CommentsProvider>. The host owns the open state + the resolver.
 */
export function PasswordPromptDialog({
  open,
  onResolve,
}: PasswordPromptDialogProps) {
  const [pw, setPw] = useState("")

  const cancel = () => {
    setPw("")
    onResolve(null)
  }

  const confirm = () => {
    if (!pw.trim()) return
    const value = pw
    setPw("")
    onResolve(value)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) cancel()
      }}
    >
      <DialogContent className="w-full max-w-xs gap-3 p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <Lock className="h-4 w-4 text-muted-foreground" />
            Editor password required
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Deleting comments requires the editor password. It will be stored for
          this session.
        </p>
        <Input
          autoFocus
          type="password"
          placeholder="Password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") confirm()
            if (e.key === "Escape") cancel()
          }}
          className="h-8 text-xs"
        />
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={cancel}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            disabled={!pw.trim()}
            onClick={confirm}
          >
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
