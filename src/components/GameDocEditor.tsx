import { useCallback, useEffect, useRef, useState } from "react"
import { useGameDoc } from "@/lib/gamedoc-store"
import {
  type Ctx,
  type GameDoc,
  type Variable,
  newSection,
} from "@/lib/gamedoc-types"
import { Button } from "@/components/ui/button"
import { RotateCcw, Settings, Loader2, Trash2 } from "lucide-react"

import { slug } from "@/lib/utils"
import { buildHeadingsMap } from "@/lib/reference-syntax"
import { TableOfContentsSidebar } from "./TableOfContentsSidebar"
import { VariablesSidebar } from "./VariablesSidebar"
import { SectionView } from "./SectionView"
import { GameDocPreview } from "./Preview"
import { ReferencesToolbar } from "./ReferencesToolbar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "./ui/dialog"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { RadioGroup, RadioGroupItem } from "./ui/radio-group"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "./ui/field"
import { Switch } from "./ui/switch"
import { useMongoCredentials } from "@/hooks/use-mongo-creds"
import { useDbSync } from "@/hooks/use-db-sync"
import { EditorToolbar } from "./EditorToolbar"
// import { GameDocViewer } from "./GameDocViewer"

export type EditorView = "preview" | "editor" /* | "json-preview"  */

export function GameDocEditor() {
  const storageKey = "is_new_project"

  const { doc, setDoc, clearCurrentDoc, loaded } = useGameDoc()
  const [query, setQuery] = useState("")
  const [view, setView] = useState<EditorView>("preview")
  const [syncModalState, setSyncModalState] = useState<"load" | "save" | null>(
    null
  )
  const [autoSync, setAutoSync] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isNewProject, setIsNewProject] = useState<boolean>(() => {
    const saved = localStorage.getItem(storageKey)
    return saved === null ? true : saved === "true"
  })

  const fileRef = useRef<HTMLInputElement>(null)
  const didInitialLoad = useRef(false)

  // Stable ref so useDbSync can always read the latest doc without
  // being included in its dependency array.
  const docRef = useRef(doc)
  useEffect(() => {
    docRef.current = doc
  }, [doc])

  const { credentials, saveCredentials, clearCredentials } =
    useMongoCredentials()
  const { syncStatus, loadFromDb, saveToDb } = useDbSync(
    credentials,
    setDoc,
    () => docRef.current
  )

  const update = useCallback(
    (fn: (d: GameDoc) => GameDoc) => setDoc((d) => (d ? fn(d) : d)),
    [setDoc]
  )

  useEffect(() => {
    localStorage.setItem(storageKey, String(isNewProject))
  }, [isNewProject])

  useEffect(() => {
    if (isNewProject || didInitialLoad.current) return
    if (!credentials) return
    didInitialLoad.current = true
    loadFromDb()
  }, [isNewProject, credentials, loadFromDb])

  // Auto-sync to DB every 30 s when enabled
  useEffect(() => {
    if (!autoSync) return
    const id = setInterval(() => saveToDb(), 30_000)
    return () => clearInterval(id)
  }, [autoSync, saveToDb])

  // ── Handlers passed into SyncModal ─────────────────────────────────────────

  const handleSyncSubmit = useCallback(
    async (pw: string, intent: "load" | "save") => {
      saveCredentials(pw)

      if (intent === "save") {
        const ok = await saveToDb(pw)
        if (ok) setSyncModalState(null)
      } else {
        const ok = await loadFromDb(pw)
        if (ok) setSyncModalState(null)
      }
    },
    [saveCredentials, saveToDb, loadFromDb]
  )

  // ── Quick save/load (credentials already stored) ────────────────────────────

  const onQuickSave = useCallback(async () => {
    if (!credentials) {
      setSyncModalState("save")
      return
    }
    await saveToDb()
  }, [credentials, saveToDb])

  const onQuickLoad = useCallback(async () => {
    if (!credentials) {
      setSyncModalState("load")
      return
    }
    await loadFromDb()
  }, [credentials, loadFromDb])

  // ── File I/O ────────────────────────────────────────────────────────────────

  const onExport = () => {
    if (!doc) return
    const blob = new Blob([JSON.stringify(doc, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${slug(doc.title) || "gamedoc"}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const onImport = async (file: File) => {
    const text = await file.text()
    try {
      const parsed = JSON.parse(text) as GameDoc
      if (parsed && Array.isArray(parsed.sections)) setDoc(parsed)
    } catch {
      // TODO: surface this as a proper toast rather than alert
      alert("Invalid file")
    }
  }

  // ── Early returns ───────────────────────────────────────────────────────────

  if (isNewProject === null) {
    return (
      <SelectProjectTypeModal
        updateProjectType={(isNew) => setIsNewProject(isNew)}
      />
    )
  }

  if (!loaded || !doc) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-muted-foreground">
        <RotateCcw className="h-4 w-4 shrink-0 animate-spin" /> Loading…
      </div>
    )
  }

  const headings = buildHeadingsMap(doc)
  const allVars = new Map<string, Variable>()
  doc.sections.forEach((s) => s.variables.forEach((v) => allVars.set(v.id, v)))
  const ctx: Ctx = { headings, vars: allVars }

  const addSection = () =>
    update((d) => ({ ...d, sections: [...d.sections, newSection()] }))

  const isBusy = syncStatus.state === "loading" || syncStatus.state === "saving"

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-450">
        <TableOfContentsSidebar
          doc={doc}
          query={query}
          setQuery={setQuery}
          onReorder={(next) => update(() => next)}
        />

        <main className="relative min-w-0 flex-1 space-y-8 pt-6">
          {view === "editor" && (
            <CenterEditorView
              ctx={ctx}
              doc={doc}
              update={update}
              openSettings={() => setSettingsOpen(true)}
            />
          )}
          {view === "preview" && <GameDocPreview doc={doc} ctx={ctx} />}
          {/* {view === "json-preview" && <GameDocViewer doc={doc} />} */}

          {/* Sticky toolbar */}
          <EditorToolbar
            isBusy={isBusy}
            ctx={ctx}
            doc={doc}
            fileRef={fileRef}
            syncStatus={syncStatus}
            view={view}
            onExport={onExport}
            onQuickLoad={onQuickLoad}
            onQuickSave={onQuickSave}
            setView={setView}
            addSection={addSection}
          />

          <div className="sticky bottom-0 z-20 h-0">
            <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-background to-transparent" />
          </div>
        </main>

        <VariablesSidebar
          doc={doc}
          onChangeSection={(sIdx, fn) =>
            update((d) => ({
              ...d,
              sections: d.sections.map((s, i) => (i === sIdx ? fn(s) : s)),
            }))
          }
        />
      </div>

      {!!syncModalState && (
        <SyncModal
          intent={syncModalState}
          open={syncModalState !== null}
          isBusy={isBusy}
          syncError={syncStatus.state === "error" ? syncStatus.message : null}
          defaultCredentials={credentials}
          onSubmit={handleSyncSubmit}
          onClose={() => setSyncModalState(null)}
        />
      )}

      <SettingsModal
        open={settingsOpen}
        autoSync={autoSync}
        hasCredentials={!!credentials}
        onSetOpen={setSettingsOpen}
        onClearCurrentDoc={clearCurrentDoc}
        onToggleAutoSync={() => setAutoSync((v) => !v)}
        onClearCredentials={clearCredentials}
      />

      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onImport(f)
          e.target.value = ""
        }}
      />
    </div>
  )
}

function CenterEditorView({
  doc,
  ctx,
  update,
  openSettings,
}: {
  doc: GameDoc
  ctx: Ctx
  update: (fn: (d: GameDoc) => GameDoc) => void
  openSettings: () => void
}) {
  const [curSecId, setCurSecId] = useState<string | undefined>(undefined)

  return (
    <div className="h-full space-y-8 p-6">
      <header className="flex items-start justify-between px-8">
        <div className="space-y-2">
          <input
            value={doc.title}
            onChange={(e) => update((d) => ({ ...d, title: e.target.value }))}
            className="w-full bg-transparent text-4xl font-bold tracking-tight outline-none"
            placeholder="Document title"
          />
          <p className="text-xs text-muted-foreground">
            Last saved {new Date(doc.updatedAt).toLocaleTimeString()} ·
            auto-saved locally
          </p>
        </div>
        <Button
          variant="outline"
          onClick={openSettings}
          title="Settings"
          className="flex h-12 shrink-0 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium transition hover:opacity-90"
        >
          <Settings />
        </Button>
      </header>

      {doc.sections.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
          No sections yet. Click <b>New Section</b> to get started.
        </div>
      )}

      {doc.sections.map((section, sIdx) => (
        <SectionView
          onSetCurrentSectionId={setCurSecId}
          key={section.id}
          section={section}
          ctx={ctx}
          allSections={doc.sections}
          onChange={(updater) =>
            update((d) => ({
              ...d,
              sections: d.sections.map((s, i) => (i === sIdx ? updater(s) : s)),
            }))
          }
          onRemove={() =>
            update((d) => ({
              ...d,
              sections: d.sections.filter((_, i) => i !== sIdx),
            }))
          }
          onMove={(dir) =>
            update((d) => {
              const arr = [...d.sections]
              const j = sIdx + dir
              if (j < 0 || j >= arr.length) return d
              ;[arr[sIdx], arr[j]] = [arr[j], arr[sIdx]]
              return { ...d, sections: arr }
            })
          }
        />
      ))}

      <ReferencesToolbar
        currentSectionId={curSecId}
        allSections={doc.sections}
      />
    </div>
  )
}

/**
 * SyncModal — handles both "load" and "save" intents.
 *
 * Key changes vs original:
 * - Receives `onSubmit(user, pass, intent)` instead of separate callbacks,
 *   so credential persistence always happens here before the action fires.
 * - `isBusy` / `syncError` come from the hook so state is never duplicated.
 * - `handleSubmit` is typed correctly as `React.FormEvent<HTMLFormElement>`.
 */
function SyncModal({
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
            <Label htmlFor="app-pw">Atlas Data API URL</Label>
            <Input
              type="password"
              id="app-pw"
              placeholder="Enter pw..."
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

function SettingsModal({
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

function SelectProjectTypeModal({
  updateProjectType,
}: {
  updateProjectType: (isNew: boolean) => void
}) {
  // Fixed: was always setting true; now correctly tracks the radio selection.
  const [isNew, setIsNew] = useState(true)

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center">
      <h1 className="mb-2">Are you starting a new project?</h1>
      <RadioGroup
        defaultValue="new"
        onValueChange={(v) => setIsNew(v === "new")}
        className="max-w-sm"
      >
        <FieldLabel htmlFor="new-project">
          <Field orientation="horizontal">
            <FieldContent>
              <FieldTitle>New Project</FieldTitle>
              <FieldDescription>Ahh, a fresh start.</FieldDescription>
            </FieldContent>
            <RadioGroupItem value="new" id="new-project" />
          </Field>
        </FieldLabel>

        <FieldLabel htmlFor="not-new-project">
          <Field orientation="horizontal">
            <FieldContent>
              <FieldTitle>Continue Existing</FieldTitle>
              <FieldDescription>Back on ze grrriiind.</FieldDescription>
            </FieldContent>
            {/* Fixed: was incorrectly calling setIsNew(true) */}
            <RadioGroupItem value="existing" id="not-new-project" />
          </Field>
        </FieldLabel>

        <Button
          onClick={() => updateProjectType(isNew)}
          variant="outline"
          size="lg"
        >
          Let&apos;s Go
        </Button>
      </RadioGroup>
    </div>
  )
}
