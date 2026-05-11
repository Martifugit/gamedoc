import type {
  GameDoc,
  Section,
  Container,
  Block,
  Variable,
  Ctx,
} from "@/lib/gamedoc-types"
import { slug } from "@/lib/utils"

export async function exportToPdf(doc: GameDoc, ctx: Ctx) {
  const { default: jsPDF } = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")

  type jsPDF = import("jspdf").default

  // ─── Design tokens ────────────────────────────────────────────────────────────

  const FONT = "helvetica"

  const COLOR = {
    title: [15, 15, 15] as [number, number, number],
    heading: [30, 30, 30] as [number, number, number],
    body: [60, 60, 60] as [number, number, number],
    muted: [120, 120, 120] as [number, number, number],
    border: [210, 210, 210] as [number, number, number],
    tableHead: [240, 240, 240] as [number, number, number],
    tableRowAlt: [250, 250, 250] as [number, number, number],
  }

  const PAGE = { w: 210, h: 297 } // A4 mm
  const MARGIN = { top: 20, right: 20, bottom: 20, left: 20 }
  const CONTENT_W = PAGE.w - MARGIN.left - MARGIN.right

  // ─── Inline text resolver ─────────────────────────────────────────────────────
  // Mirrors RenderInline but produces plain text for PDF output.

  function resolveInline(text: string, ctx: Ctx): string {
    return text.replace(
      /(\[\[ref:([^\]|]+)(?:\|([^\]]+))?\]\])|(\{\{var:([^}]+)\}\})|(\[([^\]]+)\]\(([^)]+)\))/g,
      (
        _m,
        refFull,
        refId,
        refLabel,
        varFull,
        varId,
        linkFull,
        linkLabel,
        linkUrl
      ) => {
        if (refFull) return refLabel ?? ctx.headings.get(refId) ?? "section"
        if (varFull) return ctx.vars.get(varId)?.value ?? "?"
        if (linkFull) return `${linkLabel} (${linkUrl})`
        return _m
      }
    )
  }

  // ─── Cursor ───────────────────────────────────────────────────────────────────

  class Cursor {
    y: number
    page: number
    private pdf: jsPDF

    constructor(pdf: jsPDF) {
      this.pdf = pdf
      this.y = MARGIN.top
      this.page = pdf.getCurrentPageInfo().pageNumber
    }

    need(needed: number) {
      if (this.y + needed > PAGE.h - MARGIN.bottom) {
        this.pdf.addPage()
        this.page = this.pdf.getCurrentPageInfo().pageNumber
        this.y = MARGIN.top
      }
    }

    gap(mm: number) {
      this.y += mm
    }
  }

  // ─── Text helpers ─────────────────────────────────────────────────────────────

  function setStyle(
    pdf: jsPDF,
    size: number,
    color: [number, number, number],
    style: "normal" | "bold" | "italic" = "normal"
  ) {
    pdf.setFont(FONT, style)
    pdf.setFontSize(size)
    pdf.setTextColor(...color)
  }

  function writeText(
    pdf: jsPDF,
    cursor: Cursor,
    text: string,
    size: number,
    color: [number, number, number],
    style: "normal" | "bold" | "italic" = "normal",
    opts: { lineGap?: number; indent?: number } = {}
  ): number {
    if (!text.trim()) return 0
    setStyle(pdf, size, color, style)

    const indent = opts.indent ?? 0
    const lineGap = opts.lineGap ?? 1.5
    const maxW = CONTENT_W - indent
    const lines = pdf.splitTextToSize(text, maxW) as string[]
    const lineH = size * 0.3528 + lineGap

    for (const line of lines) {
      cursor.need(lineH + 2)
      pdf.text(line, MARGIN.left + indent, cursor.y)
      cursor.y += lineH
    }
    return lines.length * lineH
  }

  // ─── Block renderers ──────────────────────────────────────────────────────────

  function renderParagraph(pdf: jsPDF, cursor: Cursor, text: string, ctx: Ctx) {
    const clean = resolveInline(text, ctx).trim()
    if (!clean) return
    cursor.need(10)
    writeText(pdf, cursor, clean, 10, COLOR.body, "normal", { lineGap: 2 })
    cursor.gap(3)
  }

  function renderList(
    pdf: jsPDF,
    cursor: Cursor,
    ordered: boolean,
    items: string[],
    ctx: Ctx
  ) {
    items.forEach((item, i) => {
      const resolved = resolveInline(item, ctx)
      const bullet = ordered ? `${i + 1}.` : "\u2022"
      cursor.need(7)
      setStyle(pdf, 10, COLOR.body, "normal")
      pdf.text(bullet, MARGIN.left + 2, cursor.y)
      const lines = pdf.splitTextToSize(resolved, CONTENT_W - 12) as string[]
      lines.forEach((line, li) => {
        cursor.need(6)
        pdf.text(line, MARGIN.left + 9, cursor.y)
        if (li < lines.length - 1) cursor.y += 5.5
      })
      cursor.y += 5.5
    })
    cursor.gap(2)
  }

  function renderTable(
    pdf: jsPDF,
    cursor: Cursor,
    headers: string[],
    rows: string[][]
  ) {
    cursor.need(14)
    autoTable(pdf, {
      startY: cursor.y,
      head: [headers],
      body: rows,
      margin: { left: MARGIN.left, right: MARGIN.right },
      styles: {
        font: FONT,
        fontSize: 9,
        cellPadding: 3,
        textColor: COLOR.body,
        lineColor: COLOR.border,
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: COLOR.tableHead,
        textColor: COLOR.heading,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: COLOR.tableRowAlt },
      tableLineColor: COLOR.border,
      tableLineWidth: 0.2,
    })
    cursor.y =
      (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY + 5
  }

  function renderBlock(pdf: jsPDF, cursor: Cursor, block: Block, ctx: Ctx) {
    switch (block.type) {
      case "paragraph":
        renderParagraph(pdf, cursor, block.text, ctx)
        break
      case "list":
        renderList(pdf, cursor, block.ordered, block.items, ctx)
        break
      case "table":
        renderTable(pdf, cursor, block.headers, block.rows)
        break
    }
  }

  // ─── Container ────────────────────────────────────────────────────────────────

  const HEADING_SIZE: Record<number, number> = { 1: 16, 2: 13, 3: 11, 4: 10 }

  function renderContainer(
    pdf: jsPDF,
    cursor: Cursor,
    container: Container,
    ctx: Ctx
  ) {
    const size = HEADING_SIZE[container.level] ?? 13
    cursor.need(size * 0.5 + 10)
    cursor.gap(4)
    writeText(pdf, cursor, container.title, size, COLOR.heading, "bold")
    cursor.gap(3)

    for (const block of container.blocks) renderBlock(pdf, cursor, block, ctx)

    for (const kv of container.keyValues ?? []) {
      if (!kv.pairs.length) continue

      cursor.need(12)
      cursor.gap(2)
      pdf.setDrawColor(...COLOR.border)
      pdf.setLineWidth(0.3)
      pdf.line(MARGIN.left, cursor.y, MARGIN.left + CONTENT_W, cursor.y)
      cursor.gap(3)
      writeText(pdf, cursor, kv.subtitle ?? "Details", 9, COLOR.muted, "bold")
      cursor.gap(2)

      for (const pair of kv.pairs) {
        cursor.need(7)
        setStyle(pdf, 9, COLOR.muted, "bold")
        pdf.text(pair.key, MARGIN.left, cursor.y)
        setStyle(pdf, 9, COLOR.body, "normal")
        const valLines = pdf.splitTextToSize(
          resolveInline(pair.value, ctx),
          CONTENT_W - 45
        ) as string[]
        valLines.forEach((line, li) => {
          if (li > 0) {
            cursor.y += 5
            cursor.need(6)
          }
          pdf.text(line, MARGIN.left + 42, cursor.y)
        })
        cursor.y += 5.5
      }
      cursor.gap(2)
    }
  }

  // ─── Variables ────────────────────────────────────────────────────────────────

  function renderVariables(pdf: jsPDF, cursor: Cursor, variables: Variable[]) {
    if (!variables.length) return
    cursor.need(16)
    cursor.gap(4)
    writeText(pdf, cursor, "Variables", 10, COLOR.muted, "bold")
    cursor.gap(2)
    renderTable(
      pdf,
      cursor,
      ["Name", "Value"],
      variables.map((v) => [v.name, v.value])
    )
  }

  // ─── Section ──────────────────────────────────────────────────────────────────

  /** Always starts a new page. Returns the page number it landed on. */
  function renderSection(pdf: jsPDF, section: Section, ctx: Ctx): number {
    pdf.addPage()
    const cursor = new Cursor(pdf)
    const landedPage = pdf.getCurrentPageInfo().pageNumber

    writeText(pdf, cursor, section.title, 20, COLOR.title, "bold")
    cursor.gap(2)

    if (section.description) {
      writeText(
        pdf,
        cursor,
        resolveInline(section.description, ctx),
        10,
        COLOR.muted,
        "italic"
      )
    }
    cursor.gap(6)

    for (const container of section.containers)
      renderContainer(pdf, cursor, container, ctx)
    renderVariables(pdf, cursor, section.variables)

    return landedPage
  }

  // ─── Cover ────────────────────────────────────────────────────────────────────

  function renderCover(pdf: jsPDF, doc: GameDoc) {
    const cy = PAGE.h * 0.4

    setStyle(pdf, 28, COLOR.title, "bold")
    pdf.text(doc.title, PAGE.w / 2, cy, { align: "center" })

    setStyle(pdf, 10, COLOR.muted, "normal")
    pdf.text(
      `Updated ${new Date(doc.updatedAt).toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" })}`,
      PAGE.w / 2,
      cy + 12,
      { align: "center" }
    )

    setStyle(pdf, 9, COLOR.muted, "italic")
    pdf.text(
      `${doc.sections.length} section${doc.sections.length !== 1 ? "s" : ""}`,
      PAGE.w / 2,
      cy + 19,
      { align: "center" }
    )
  }

  // ─── TOC ──────────────────────────────────────────────────────────────────────

  /** Written into the pre-allocated page 2 after sections have been rendered. */
  function renderToc(pdf: jsPDF, doc: GameDoc, sectionPages: number[]) {
    pdf.setPage(2)
    let y = MARGIN.top

    // Heading
    setStyle(pdf, 16, COLOR.title, "bold")
    pdf.text("Contents", MARGIN.left, y)
    y += 16 * 0.3528 + 1.5 + 6

    doc.sections.forEach((section, si) => {
      if (y > PAGE.h - MARGIN.bottom) return

      const pageStr = String(sectionPages[si])

      // Section row
      setStyle(pdf, 11, COLOR.heading, "bold")
      pdf.text(section.title || "Untitled", MARGIN.left, y)

      const titleW = pdf.getTextWidth(section.title || "Untitled")
      const pageW = pdf.getTextWidth(pageStr)
      const gapW = CONTENT_W - titleW - pageW - 4

      if (gapW > 3) {
        setStyle(pdf, 9, COLOR.muted, "normal")
        const dotW = pdf.getTextWidth(".")
        const dotCount = Math.max(1, Math.floor(gapW / (dotW + 0.5)))
        const spread = gapW / Math.max(dotCount - 1, 1)
        pdf.text(".".repeat(dotCount), MARGIN.left + titleW + 2, y, {
          charSpace: Math.max(0, spread - dotW),
        })
      }

      setStyle(pdf, 11, COLOR.heading, "bold")
      pdf.text(pageStr, PAGE.w - MARGIN.right, y, { align: "right" })
      y += 7

      // Container rows (indented, no page number)
      section.containers.forEach((c) => {
        if (y > PAGE.h - MARGIN.bottom) return
        const indent = 4 + (c.level - 1) * 4
        setStyle(pdf, 9, COLOR.body, "normal")
        pdf.text(c.title || "Untitled", MARGIN.left + indent, y)
        y += 5
      })

      y += 3
    })
  }

  // ─── Page numbers ─────────────────────────────────────────────────────────────

  function addPageNumbers(pdf: jsPDF) {
    const total = pdf.getNumberOfPages()
    for (let i = 1; i <= total; i++) {
      pdf.setPage(i)
      setStyle(pdf, 8, COLOR.muted, "normal")
      pdf.text(`${i} / ${total}`, PAGE.w - MARGIN.right, PAGE.h - 8, {
        align: "right",
      })
    }
  }

  // ─── Main export ──────────────────────────────────────────────────────────────

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" })

  // Page 1 — cover
  renderCover(pdf, doc)

  // Page 2 — TOC placeholder (written last, once we know page numbers)
  pdf.addPage()

  // Pages 3+ — sections; collect landing pages as we go
  const sectionPages: number[] = []
  for (const section of doc.sections) {
    sectionPages.push(renderSection(pdf, section, ctx))
  }

  // Write TOC into page 2 now that we have the real page numbers
  renderToc(pdf, doc, sectionPages)

  addPageNumbers(pdf)

  pdf.save(`${slug(doc.title) || "gamedoc"}.pdf`)
}
