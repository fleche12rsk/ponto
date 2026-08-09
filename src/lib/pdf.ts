import { jsPDF } from 'jspdf'
import type { ReportModel } from './report'

/* ============================================================
   PDF do relatório (§10)

   Quem lê é o CLIENTE do freelancer, não o usuário do app: fundo branco,
   sóbrio, sem o tema escuro. O âmbar aparece só como fio de destaque.

   Fontes: o PDF usa as famílias padrão do PDF (Times, Helvetica, Courier)
   em vez de Source Serif / Public Sans / IBM Plex Mono. São vetoriais,
   universais e não somam megabytes de fonte embutida ao APK; o papel de
   cada uma (serifada nos títulos, mono nos números) é o mesmo do §5.4.
   ============================================================ */

const PAGE_W = 210
const PAGE_H = 297
const MARGIN = 20
const CONTENT_W = PAGE_W - MARGIN * 2

const INK = { r: 26, g: 24, b: 19 } // #1A1813
const MUTED = { r: 124, g: 119, b: 104 } // #7C7768
const RULE = { r: 232, g: 228, b: 218 } // #E8E4DA
const AMBER = { r: 245, g: 161, b: 0 } // #F5A100
const ZEBRA = 245 // cinza ~4%

interface Column {
  key: 'date' | 'time' | 'duration' | 'note' | 'value'
  label: string
  width: number
  align: 'left' | 'right'
  mono?: boolean
}

function columns(includeNotes: boolean): Column[] {
  if (includeNotes) {
    return [
      { key: 'date', label: 'Data', width: 18, align: 'left', mono: true },
      { key: 'time', label: 'Início–Fim', width: 28, align: 'left', mono: true },
      { key: 'duration', label: 'Duração', width: 20, align: 'right', mono: true },
      { key: 'note', label: 'Descrição', width: 74, align: 'left' },
      { key: 'value', label: 'Valor', width: 30, align: 'right', mono: true },
    ]
  }
  return [
    { key: 'date', label: 'Data', width: 30, align: 'left', mono: true },
    { key: 'time', label: 'Início–Fim', width: 45, align: 'left', mono: true },
    { key: 'duration', label: 'Duração', width: 40, align: 'right', mono: true },
    { key: 'value', label: 'Valor', width: 55, align: 'right', mono: true },
  ]
}

export function generateReportPdf(model: ReportModel, includeNotes: boolean): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const cols = columns(includeNotes)

  let y = drawHeader(doc, model, true)
  y = drawClientBlock(doc, model, y)

  for (const group of model.groups) {
    y = ensureSpace(doc, model, y, 26)
    y = drawGroupHeader(doc, group.projectName, y)
    y = drawTableHead(doc, cols, y)

    let zebra = false
    for (const line of group.lines) {
      const cells: Record<Column['key'], string> = {
        date: line.date + (line.invoiced ? ' (faturado)' : ''),
        time: line.timeRange,
        duration: line.duration,
        note: line.note,
        value: line.value,
      }

      // A descrição pode ocupar várias linhas; a altura da linha segue ela.
      const noteCol = cols.find((c) => c.key === 'note')
      const noteLines = noteCol
        ? doc.splitTextToSize(cells.note, noteCol.width - 3)
        : ['']
      const rowH = Math.max(7, noteLines.length * 4.6 + 2.4)

      y = ensureSpace(doc, model, y, rowH + 10, cols)

      if (zebra) {
        doc.setFillColor(ZEBRA, ZEBRA, ZEBRA)
        doc.rect(MARGIN, y - 4.6, CONTENT_W, rowH, 'F')
      }
      zebra = !zebra

      let x = MARGIN
      for (const col of cols) {
        setBody(doc, col.mono)
        if (col.key === 'note') {
          doc.text(noteLines, x + 1, y)
        } else {
          const text = cells[col.key]
          const tx = col.align === 'right' ? x + col.width - 1 : x + 1
          doc.text(text, tx, y, { align: col.align })
        }
        x += col.width
      }
      y += rowH
    }

    y = drawSubtotal(doc, group.subtotalDuration, group.subtotalValue, y)
    y += 6
  }

  if (model.isEmpty) {
    setBody(doc)
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
    doc.text('Nenhuma hora registrada neste período.', MARGIN, y + 6)
    y += 12
  }

  y = ensureSpace(doc, model, y, 30)
  drawGrandTotal(doc, model, y)
  drawFooters(doc, model)

  return doc
}

/* ---------- Blocos ---------- */

function drawHeader(doc: jsPDF, model: ReportModel, first: boolean): number {
  const top = MARGIN

  doc.setFont('times', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(INK.r, INK.g, INK.b)
  doc.text(model.freelancerName, MARGIN, top + 2)

  if (model.freelancerContact) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
    doc.text(model.freelancerContact, MARGIN, top + 8)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  doc.text('RELATÓRIO DE HORAS', PAGE_W - MARGIN, top + 1, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(INK.r, INK.g, INK.b)
  doc.text(model.periodLabel, PAGE_W - MARGIN, top + 7, { align: 'right' })

  const ruleY = top + 13
  doc.setDrawColor(RULE.r, RULE.g, RULE.b)
  doc.setLineWidth(0.2)
  doc.line(MARGIN, ruleY, PAGE_W - MARGIN, ruleY)

  return ruleY + (first ? 12 : 10)
}

function drawClientBlock(doc: jsPDF, model: ReportModel, y: number): number {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  doc.text('Cliente', MARGIN, y)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(INK.r, INK.g, INK.b)
  doc.text(model.clientName, MARGIN, y + 6)

  if (model.uniformRate) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
    doc.text(`Valor por hora: ${model.uniformRate}`, PAGE_W - MARGIN, y + 6, {
      align: 'right',
    })
  }

  // Linha grande de resumo, com fio âmbar sob o valor (§10).
  const summaryY = y + 20
  doc.setFont('times', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(INK.r, INK.g, INK.b)
  const summary = `Total: ${model.totalDuration} — ${model.totalValue}`
  doc.text(summary, MARGIN, summaryY)

  const valueWidth = doc.getTextWidth(model.totalValue)
  const summaryWidth = doc.getTextWidth(summary)
  doc.setDrawColor(AMBER.r, AMBER.g, AMBER.b)
  doc.setLineWidth(0.7)
  doc.line(
    MARGIN + summaryWidth - valueWidth,
    summaryY + 2.2,
    MARGIN + summaryWidth,
    summaryY + 2.2,
  )

  return summaryY + 14
}

function drawGroupHeader(doc: jsPDF, name: string, y: number): number {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(INK.r, INK.g, INK.b)
  doc.text(name, MARGIN, y)
  return y + 6
}

function drawTableHead(doc: jsPDF, cols: Column[], y: number): number {
  const top = y || MARGIN + 20
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)

  let x = MARGIN
  for (const col of cols) {
    const tx = col.align === 'right' ? x + col.width - 1 : x + 1
    doc.text(col.label.toUpperCase(), tx, top, { align: col.align })
    x += col.width
  }

  doc.setDrawColor(RULE.r, RULE.g, RULE.b)
  doc.setLineWidth(0.2)
  doc.line(MARGIN, top + 1.8, PAGE_W - MARGIN, top + 1.8)

  return top + 7
}

function drawSubtotal(doc: jsPDF, duration: string, value: string, y: number): number {
  doc.setDrawColor(RULE.r, RULE.g, RULE.b)
  doc.setLineWidth(0.2)
  doc.line(MARGIN, y - 3, PAGE_W - MARGIN, y - 3)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(INK.r, INK.g, INK.b)
  doc.text(`Subtotal · ${duration}`, PAGE_W - MARGIN - 40, y + 2, { align: 'right' })
  doc.text(value, PAGE_W - MARGIN, y + 2, { align: 'right' })

  return y + 8
}

function drawGrandTotal(doc: jsPDF, model: ReportModel, y: number) {
  doc.setDrawColor(AMBER.r, AMBER.g, AMBER.b)
  doc.setLineWidth(0.7)
  doc.line(PAGE_W - MARGIN - 80, y, PAGE_W - MARGIN, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  doc.text('Total de horas', PAGE_W - MARGIN - 80, y + 7)
  doc.setTextColor(INK.r, INK.g, INK.b)
  doc.text(model.totalDuration, PAGE_W - MARGIN, y + 7, { align: 'right' })

  doc.setFont('times', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(INK.r, INK.g, INK.b)
  doc.text('Total a cobrar', PAGE_W - MARGIN - 80, y + 17)
  doc.text(model.totalValue, PAGE_W - MARGIN, y + 17, { align: 'right' })
}

function drawFooters(doc: jsPDF, model: ReportModel) {
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
    doc.text(`Gerado por Horas · ${model.generatedAt}`, MARGIN, PAGE_H - 12)
    doc.text(`Página ${i} de ${pages}`, PAGE_W - MARGIN, PAGE_H - 12, { align: 'right' })
  }
}

/* ---------- Paginação ---------- */

function setBody(doc: jsPDF, mono?: boolean) {
  doc.setFont(mono ? 'courier' : 'helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(INK.r, INK.g, INK.b)
}

/**
 * Quebra a página quando o próximo bloco não cabe. Redesenha o cabeçalho e,
 * se a quebra caiu no meio de uma tabela, repete o cabeçalho de colunas.
 */
function ensureSpace(
  doc: jsPDF,
  model: ReportModel,
  y: number,
  needed: number,
  repeatHead?: Column[],
): number {
  const limit = PAGE_H - MARGIN - 8
  if (y + needed <= limit) return y

  doc.addPage()
  const next = drawHeader(doc, model, false)
  return repeatHead ? drawTableHead(doc, repeatHead, next) : next
}

/* ---------- Saídas ---------- */

export function pdfToBase64(doc: jsPDF): string {
  const raw = doc.output('datauristring')
  return raw.slice(raw.indexOf(',') + 1)
}

/** Acentos decompostos por NFD, removidos para o nome do arquivo. */
const COMBINING_MARKS = /[̀-ͯ]/g

export function pdfFileName(clientName: string, periodLabel: string): string {
  const slug = (s: string) =>
    s
      .normalize('NFD')
      .replace(COMBINING_MARKS, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .toLowerCase()
  return `horas-${slug(clientName)}-${slug(periodLabel)}.pdf`
}
