import { Trash2 } from "lucide-react"
import { Button } from "./ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "./ui/dialog"
import { Label } from "./ui/label"
import { Switch } from "./ui/switch"
import { useState } from "react"

export function SettingsModal({
  open,
  autoSync,
  onSetOpen,
  onToggleAutoSync,
  hasCredentials,
  onClearCredentials,
  onClearCurrentDoc,
}: {
  open: boolean
  autoSync: boolean
  onSetOpen: (open: boolean) => void
  onToggleAutoSync: () => void
  hasCredentials: boolean
  onClearCredentials: () => void
  onClearCurrentDoc: () => void
}) {
  const [showConfirm, setShowConfirm] = useState(false)

  const handleConfirm = () => {
    onClearCurrentDoc()
    setShowConfirm(false)
    onSetOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={onSetOpen}>
      <DialogContent>
        <DialogTitle>Settings</DialogTitle>
        <DialogDescription>
          Choose how you want the editor to behave.
        </DialogDescription>
        <div className="space-y-4">
          <div className="grid grid-cols-[1fr_auto] items-center gap-4">
            <Label htmlFor="autosync-check">Auto-sync with DB every 30 s</Label>
            <Switch
              id="autosync-check"
              checked={autoSync}
              onCheckedChange={onToggleAutoSync}
            />
          </div>

          {hasCredentials && (
            <div className="grid grid-cols-[1fr_auto] items-center gap-4">
              <div>
                <p className="text-sm font-medium">Saved credentials</p>
                <p className="text-xs text-muted-foreground">
                  Clear to re-enter your Atlas endpoint and API key on next
                  sync.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={onClearCredentials}
              >
                Clear
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className={showConfirm ? "bg-red-800/10" : ""}>
          {!showConfirm && (
            <Button onClick={() => setShowConfirm(true)} variant="outline">
              <Trash2 /> Clear Document
            </Button>
          )}
          {showConfirm && (
            <div className="flex w-full items-center justify-between">
              <p className="text-lg">Are you sure?</p>
              <div className="flex items-center gap-2">
                <Button onClick={() => setShowConfirm(false)}>Cancel</Button>
                <Button onClick={handleConfirm} variant="destructive">
                  Yes
                </Button>
              </div>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
