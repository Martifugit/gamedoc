import { useCallback, useRef, useState } from "react"
import { useGameDoc } from "@/lib/gamedoc-store"
import {
  type Ctx,
  type GameDoc,
  type Variable,
  newSection,
} from "@/lib/gamedoc-types"
import { Button } from "@/components/ui/button"
import { Download, EyeIcon, FileText, Pencil, Plus, Upload } from "lucide-react"

import { slug } from "@/lib/utils"
import { buildHeadingsMap } from "@/lib/reference-syntax"
import { TableOfContents } from "./TableOfContents"
import { VariablesSidebar } from "./VariablesSidebar"
import { SectionView } from "./SectionView"
import { GameDocPreview } from "./Preview"
import { exportToPdf } from "@/lib/pdf-export"

export function GameDocEditor() {
  const { doc, setDoc, loaded } = useGameDoc()
  const [query, setQuery] = useState("")
  const [view, setView] = useState<"preview" | "editor">("editor")
  const fileRef = useRef<HTMLInputElement>(null)

  const update = useCallback(
    (fn: (d: GameDoc) => GameDoc) => setDoc((d) => (d ? fn(d) : d)),
    [setDoc]
  )

  if (!loaded || !doc) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    )
  }

  const headings = buildHeadingsMap(doc)
  const allVars = new Map<string, Variable>()
  doc.sections.forEach((s) => s.variables.forEach((v) => allVars.set(v.id, v)))
  const ctx: Ctx = { headings, vars: allVars }

  const addSection = () =>
    update((d) => ({ ...d, sections: [...d.sections, newSection()] }))

  const onExport = () => {
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
      alert("Invalid file")
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-450 gap-12 px-4">
        <TableOfContents
          doc={doc}
          query={query}
          setQuery={setQuery}
          onReorder={(next) => update(() => next)}
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
        <main className="relative min-w-0 flex-1 space-y-8 py-6 pb-32">
          {view === "editor" && (
            <CenterEditorView ctx={ctx} doc={doc} update={update} />
          )}

          {view === "preview" && <GameDocPreview doc={doc} ctx={ctx} />}

          <div className="sticky bottom-0 z-20 h-32 bg-linear-to-t from-background to-transparent" />

          {/* sticky bottom-right new section button */}
          <div className="sticky bottom-6 left-0 z-50 -mt-32 flex max-w-350 items-end justify-between gap-4 rounded-lg border bg-background/75 px-4 py-3 shadow-lg shadow-black/40 backdrop-blur-2xl">
            <div className="flex items-center gap-4">
              {view === "editor" && (
                <Button
                  variant={"outline"}
                  onClick={addSection}
                  className="flex h-12 shrink-0 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium transition hover:opacity-90"
                >
                  <Plus className="h-4 w-4" /> New Section
                </Button>
              )}
            </div>

            <div className="flex items-end gap-4">
              <Button
                variant={"outline"}
                onClick={() =>
                  setView((prev) => (prev === "editor" ? "preview" : "editor"))
                }
                className="flex h-12 shrink-0 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium transition hover:opacity-90"
              >
                {view === "preview" ? (
                  <Pencil className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </Button>

              <div className="flex flex-col gap-0">
                <Button
                  variant={"outline"}
                  onClick={onExport}
                  size="sm"
                  title="Export JSON"
                  className="flex h-6 shrink-0 items-center gap-2 rounded-md rounded-b-none bg-primary px-4 text-sm font-medium transition hover:opacity-90"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant={"outline"}
                  onClick={() => fileRef.current?.click()}
                  size="sm"
                  title="Import JSON"
                  className="flex h-6 shrink-0 items-center gap-2 rounded-md rounded-t-none bg-primary px-4 text-sm font-medium transition hover:opacity-90"
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>

              <Button
                variant={"outline"}
                onClick={() => exportToPdf(doc, ctx)}
                title="Export PDF"
                className="flex h-12 shrink-0 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium transition hover:opacity-90"
              >
                <FileText className="h-4 w-4" />
              </Button>
            </div>
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
    </div>
  )
}

function CenterEditorView({
  doc,
  ctx,
  update,
}: {
  doc: GameDoc
  ctx: Ctx
  update: (fn: (d: GameDoc) => GameDoc) => void
}) {
  return (
    <>
      <header className="space-y-2">
        <input
          value={doc.title}
          onChange={(e) => update((d) => ({ ...d, title: e.target.value }))}
          className="w-full bg-transparent text-4xl font-bold tracking-tight outline-none"
          placeholder="Document title"
        />
        <p className="text-xs text-muted-foreground">
          Last saved {new Date(doc.updatedAt).toLocaleTimeString()} · auto-saved
          locally
        </p>
      </header>

      {doc.sections.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
          No sections yet. Click <b>New Section</b> to get started.
        </div>
      )}

      {doc.sections.map((section, sIdx) => (
        <SectionView
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
    </>
  )
}
