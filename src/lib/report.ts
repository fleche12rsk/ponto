import type { Client, Database, TimeEntry } from './types'
import { entryValue, effectiveRate, entriesInPeriod, type Scope } from './calc'
import { formatDayMonth, formatRange, formatDuration, formatTime, type Period } from './time'
import { formatMoney } from './money'

/* ============================================================
   Modelo do relatório (§10)
   Uma única preparação de dados alimenta a pré-visualização em HTML,
   o PDF e o CSV: o que se vê na tela é exatamente o que sai no arquivo.
   ============================================================ */

export interface ReportOptions {
  clientId: string
  period: Period
  includeNotes: boolean
  scope: Scope
}

export interface ReportLine {
  entryId: string
  date: string
  timeRange: string
  duration: string
  note: string
  value: string
  invoiced: boolean
}

export interface ReportGroup {
  projectName: string
  lines: ReportLine[]
  subtotalDuration: string
  subtotalValue: string
}

export interface ReportModel {
  freelancerName: string
  freelancerContact: string
  clientName: string
  /** null quando os projetos usam tarifas diferentes: aí vai por projeto. */
  uniformRate: string | null
  periodLabel: string
  groups: ReportGroup[]
  totalDuration: string
  totalValue: string
  entryIds: string[]
  generatedAt: string
  isEmpty: boolean
}

export function buildReport(db: Database, options: ReportOptions): ReportModel {
  const client = db.clients.find((c) => c.id === options.clientId)
  const currency = db.settings.currency

  const projects = db.projects.filter((p) => p.client_id === options.clientId)
  const projectIds = new Set(projects.map((p) => p.id))

  const entries = entriesInPeriod(db, options.period, options.scope)
    .filter((e) => projectIds.has(e.project_id))
    .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime())

  const groups: ReportGroup[] = []
  let totalSeconds = 0
  let totalCents = 0
  const entryIds: string[] = []

  for (const project of projects) {
    const projectEntries = entries.filter((e) => e.project_id === project.id)
    if (projectEntries.length === 0) continue

    let groupSeconds = 0
    let groupCents = 0
    const lines: ReportLine[] = []

    for (const entry of projectEntries) {
      const value = entryValue(entry)
      groupSeconds += entry.duration_seconds
      groupCents += value
      entryIds.push(entry.id)

      lines.push({
        entryId: entry.id,
        date: formatDayMonth(entry.started_at),
        timeRange: rangeLabel(entry),
        duration: formatDuration(entry.duration_seconds, { short: true }),
        note: entry.note ?? '',
        value: formatMoney(value, currency),
        invoiced: entry.invoiced,
      })
    }

    totalSeconds += groupSeconds
    totalCents += groupCents

    groups.push({
      projectName: project.name,
      lines,
      subtotalDuration: formatDuration(groupSeconds, { short: true }),
      subtotalValue: formatMoney(groupCents, currency),
    })
  }

  return {
    freelancerName: db.settings.freelancer_name || 'Relatório de horas',
    freelancerContact: db.settings.freelancer_contact,
    clientName: client?.name ?? '—',
    uniformRate: uniformRateLabel(db, client, projectIds),
    periodLabel: formatRange(options.period.start, options.period.end),
    groups,
    totalDuration: formatDuration(totalSeconds),
    totalValue: formatMoney(totalCents, currency),
    entryIds,
    generatedAt: new Date().toLocaleDateString('pt-BR'),
    isEmpty: entryIds.length === 0,
  }
}

function rangeLabel(entry: TimeEntry): string {
  if (!entry.ended_at) return formatTime(entry.started_at)
  // Lançamentos por duração pura não têm horário significativo para mostrar.
  if (entry.source === 'manual' && entry.duration_seconds % 60 === 0) {
    return `${formatTime(entry.started_at)}–${formatTime(entry.ended_at)}`
  }
  return `${formatTime(entry.started_at)}–${formatTime(entry.ended_at)}`
}

/** Uma tarifa só para todos os projetos do cliente, ou null se variarem. */
function uniformRateLabel(
  db: Database,
  client: Client | undefined,
  projectIds: Set<string>,
): string | null {
  if (!client) return null
  const rates = new Set(
    db.projects
      .filter((p) => projectIds.has(p.id))
      .map((p) => effectiveRate(p, client)),
  )
  if (rates.size !== 1) return null
  return formatMoney([...rates][0], db.settings.currency)
}

/* ---------- CSV (§10) ---------- */

/**
 * Espelha a tabela do PDF. Separador `;` e decimal com vírgula, que é o que
 * o Excel em português abre sem pedir nada.
 */
export function buildCsv(db: Database, options: ReportOptions): string {
  const client = db.clients.find((c) => c.id === options.clientId)
  const projects = db.projects.filter((p) => p.client_id === options.clientId)
  const projectIds = new Set(projects.map((p) => p.id))

  const entries = entriesInPeriod(db, options.period, options.scope)
    .filter((e) => projectIds.has(e.project_id))
    .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime())

  const header = [
    'cliente',
    'projeto',
    'data',
    'inicio',
    'fim',
    'duracao_horas',
    'valor_hora',
    'valor',
    'nota',
    'faturado',
  ]

  const rows = entries.map((entry) => {
    const project = projects.find((p) => p.id === entry.project_id)
    const started = new Date(entry.started_at)
    return [
      client?.name ?? '',
      project?.name ?? '',
      started.toLocaleDateString('pt-BR'),
      formatTime(entry.started_at),
      entry.ended_at ? formatTime(entry.ended_at) : '',
      decimal(entry.duration_seconds / 3600),
      decimal(entry.rate_cents_snapshot / 100),
      decimal(entryValue(entry) / 100),
      entry.note ?? '',
      entry.invoiced ? 'sim' : 'nao',
    ]
  })

  // BOM na frente para o Excel reconhecer o UTF-8 e não quebrar os acentos.
  return '﻿' + [header, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n')
}

function decimal(value: number): string {
  return value.toFixed(2).replace('.', ',')
}

function csvCell(value: string): string {
  if (/[";\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}
