import { Loader2 } from "lucide-react"
import { Button } from "./ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog"
import { Label } from "./ui/label"
import { useState } from "react"
import { Input } from "./ui/input"

/**
 * SyncAuthModal — handles both "load" and "save" intents.
 *
 * Key changes vs original:
 * - Receives `onSubmit(user, pass, intent)` instead of separate callbacks,
 *   so credential persistence always happens here before the action fires.
 * - `isBusy` / `syncError` come from the hook so state is never duplicated.
 * - `handleSubmit` is typed correctly as `React.FormEvent<HTMLFormElement>`.
 */
export function SyncAuthModal({
  open,
  intent,
  isBusy,
  syncError,
  defaultCredentials,
  onSubmit,
  onClose,
}: {
  open: boolean
  intent: "save" | "load"
  isBusy: boolean
  syncError: string | null
  defaultCredentials: string | null
  onSubmit: (pw: string, intent: "save" | "load") => Promise<void>
  onClose: () => void
}) {
  const [field, setField] = useState(defaultCredentials ?? "")

  const canSubmit = field.trim() !== "" && !isBusy

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!canSubmit) return
    await onSubmit(field, intent)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogTitle>
          {intent === "save" ? "Save to DB" : "Load from DB"}
        </DialogTitle>
        <DialogDescription>
          Credentials are saved locally and reused for auto-sync.
        </DialogDescription>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="app-pw">Application Password</Label>
            <Input
              type="password"
              id="app-pw"
              placeholder="Enter pw..."
              autoComplete="current-password"
              value={field}
              onChange={(e) => setField(e.target.value)}
            />
          </div>

          {syncError && (
            <p className="text-sm font-medium text-red-500">{syncError}</p>
          )}

          <Button type="submit" disabled={!canSubmit} className="w-full">
            {isBusy ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {intent === "save" ? "Saving…" : "Loading…"}
              </span>
            ) : intent === "save" ? (
              "Save to DB"
            ) : (
              "Load from DB"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
