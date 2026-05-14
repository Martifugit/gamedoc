import type { SyncStatus } from "@/hooks/use-sheet-sync"
import type { EditorView } from "./GameDocEditor"
import type { Ctx, GameDoc } from "@/lib/gamedoc-types"
import { Button } from "./ui/button"
import {
  AlertCircle,
  CheckCircle2,
  DatabaseBackup,
  Download,
  EyeIcon,
  FileDown,
  //   FileJson2,
  Loader2,
  Pencil,
  Plus,
  Save,
  Upload,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { exportToPdf } from "@/lib/pdf-export"
import { ButtonGroup } from "./button-group"

interface EditorToolbarProps {
  syncStatus: SyncStatus
  view: EditorView
  addSection: () => void
  setView: React.Dispatch<React.SetStateAction<EditorView>>
  fileRef: React.RefObject<HTMLInputElement | null>
  onExport: () => void
  onQuickLoad: () => Promise<void>
  isBusy: boolean
  onQuickSave: () => Promise<void>
  doc: GameDoc
  ctx: Ctx
}

export function EditorToolbar({
  syncStatus,
  view,
  addSection,
  setView,
  fileRef,
  onExport,
  onQuickLoad,
  isBusy,
  onQuickSave,
  doc,
  ctx,
}: EditorToolbarProps) {
  return (
    <div className="sticky bottom-6 z-50 mx-auto flex max-w-200 px-4">
      {/* Sync status banner */}
      <SyncStatusBanner status={syncStatus} />

      <div className="absolute inset-x-0 bottom-0 z-1 grid w-full flex-1 grid-cols-3 gap-4 rounded-lg border bg-background/75 p-2 shadow-lg shadow-black/40 backdrop-blur-2xl">
        <div className="col-start-1 col-end-1">
          {view === "editor" && (
            <Button
              variant="outline"
              size="default"
              onClick={addSection}
              className="flex h-full shrink-0 rounded-sm font-medium"
            >
              <Plus /> New Section
            </Button>
          )}
        </div>

        {/* View switcher */}
        <div className="col-start-2 col-end-2 justify-self-center">
          <ButtonGroup
            contents={(
              [
                {
                  id: "editor",
                  icon: <Pencil size={16} />,
                  title: "Edit",
                },
                {
                  id: "preview",
                  icon: <EyeIcon size={16} />,
                  title: "Preview",
                },
                // {
                //   id: "json-preview",
                //   icon: <FileJson2 size={16} />,
                //   title: "JSON",
                // },
              ] as const
            ).map(({ id, icon, title }) => ({
              slot: icon,
              title: title,
              onClick: () => setView(id),
              selected: view === id,
            }))}
          />
        </div>

        {/* File & DB actions */}
        <div className="col-start-3 col-end-3 flex items-center justify-end gap-2">
          <ButtonGroup
            contents={[
              {
                slot: <Upload />,
                title: "Import JSON",
                onClick: () => fileRef.current?.click(),
              },
              {
                slot: <Download />,
                title: "Export JSON",
                onClick: onExport,
              },
            ]}
          />

          <ButtonGroup
            contents={[
              {
                slot:
                  syncStatus.state === "loading" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <DatabaseBackup />
                  ),
                title: "Load latest from DB",
                disabled: isBusy,
                onClick: onQuickLoad,
              },
              {
                slot:
                  syncStatus.state === "saving" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Save />
                  ),
                title: "Save to DB",
                disabled: isBusy,
                onClick: onQuickSave,
              },
            ]}
          />

          <Button
            variant="outline"
            size="icon-lg"
            onClick={() => exportToPdf(doc, ctx)}
            title="Export PDF"
            className="rounded-sm"
          >
            <FileDown />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SyncStatusBanner({ status }: { status: SyncStatus }) {
  //   const status = { state: "loading" }

  const config = {
    idle: {
      icon: undefined,
      text: "",
      cls: "bg-transparent -translate-y-16 bg-card",
    },
    loading: {
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
      text: "Loading from sheet…",
      cls: "bg-blue-900 text-blue-300 border-blue-500/20",
    },
    saving: {
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
      text: "Saving to sheet…",
      cls: "bg-blue-900 text-blue-300 border-blue-500/20",
    },
    success: {
      icon: <CheckCircle2 className="h-4 w-4" />,
      text: (status as Extract<SyncStatus, { state: "success" }>).message,
      cls: "bg-green-900 text-green-300 border-green-500/20",
    },
    error: {
      icon: <AlertCircle className="h-4 w-4" />,
      text: (status as Extract<SyncStatus, { state: "error" }>).message,
      cls: "bg-red-900 text-red-200 border-red-500/20",
    },
  }[status.state]

  return (
    <div
      className={cn(
        "absolute inset-x-[2%] flex h-6 items-center justify-center gap-2 rounded-t-lg border-x border-t px-4 text-sm transition-all duration-300",
        config.cls,
        status.state !== "idle" && "-translate-y-19.5"
      )}
    >
      {config.icon}
      {config.text}
    </div>
  )
}
