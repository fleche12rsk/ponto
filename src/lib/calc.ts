import type { Client, Database, Project, TimeEntry } from './types'
import { entryValueCents } from './money'
import { dayKeyOf, isInPeriod, type Period } from './time'

/* ============================================================
   Agregações — totais por período, cliente e projeto
   ============================================================ */

/** Alternância "A cobrar | Faturado | Tudo" do Resumo (§4.5). */
export type Scope = 'unbilled' | 'invoiced' | 'all'

export function matchesScope(entry: TimeEntry, scope: Scope): boolean {
  if (scope === 'all') return true
  return scope === 'invoiced' ? entry.invoiced : !entry.invoiced
}

/** Valor/hora efetivo: o do projeto, ou o do cliente se o projeto não tiver. */
export function effectiveRate(project: Project, client: Client | undefined): number {
  if (project.rate_cents !== null) return project.rate_cents
  return client?.default_rate_cents ?? 0
}

/** Registros fechados (o timer em andamento não entra em nenhum total). */
export function closedEntries(db: Database): TimeEntry[] {
  return db.entries.filter((e) => e.ended_at !== null)
}

export function entriesInPeriod(db: Database, period: Period, scope: Scope = 'all'): TimeEntry[] {
  return closedEntries(db).filter(
    (e) => isInPeriod(e.started_at, period) && matchesScope(e, scope),
  )
}

export function entryValue(entry: TimeEntry): number {
  return entryValueCents(entry.duration_seconds, entry.rate_cents_snapshot)
}

export interface Totals {
  seconds: number
  cents: number
  count: number
}

export function sumEntries(entries: TimeEntry[]): Totals {
  let seconds = 0
  let cents = 0
  for (const e of entries) {
    seconds += e.duration_seconds
    cents += entryValue(e)
  }
  return { seconds, cents, count: entries.length }
}

export interface ClientBreakdown {
  client: Client
  totals: Totals
  /** 0–1, fatia do valor total do período. Move a barra de proporção (§4.5). */
  share: number
}

/** Clientes do período, ordenados por R$ desc (§4.5). */
export function breakdownByClient(db: Database, entries: TimeEntry[]): ClientBreakdown[] {
  const projectToClient = new Map(db.projects.map((p) => [p.id, p.client_id]))
  const byClient = new Map<string, TimeEntry[]>()

  for (const e of entries) {
    const clientId = projectToClient.get(e.project_id)
    if (!clientId) continue
    const list = byClient.get(clientId)
    if (list) list.push(e)
    else byClient.set(clientId, [e])
  }

  const rows: ClientBreakdown[] = []
  let grandCents = 0

  for (const [clientId, list] of byClient) {
    const client = db.clients.find((c) => c.id === clientId)
    if (!client) continue
    const totals = sumEntries(list)
    grandCents += totals.cents
    rows.push({ client, totals, share: 0 })
  }

  for (const row of rows) {
    // Sem valor no período (tarifa zerada), a barra usa a fatia de tempo.
    row.share =
      grandCents > 0
        ? row.totals.cents / grandCents
        : rows.reduce((acc, r) => acc + r.totals.seconds, 0) > 0
          ? row.totals.seconds / rows.reduce((acc, r) => acc + r.totals.seconds, 0)
          : 0
  }

  return rows.sort((a, b) => b.totals.cents - a.totals.cents || b.totals.seconds - a.totals.seconds)
}

export interface ProjectBreakdown {
  project: Project
  totals: Totals
  /** Progresso contra o orçado, 0–1+ (pode passar de 1). null = sem orçamento. */
  budgetProgress: number | null
  /** Segundos acima do orçado, ou 0. */
  overBy: number
}

export function breakdownByProject(
  db: Database,
  entries: TimeEntry[],
  clientId?: string,
): ProjectBreakdown[] {
  const projects = clientId
    ? db.projects.filter((p) => p.client_id === clientId)
    : db.projects

  const rows: ProjectBreakdown[] = []

  for (const project of projects) {
    const list = entries.filter((e) => e.project_id === project.id)
    if (list.length === 0 && project.archived) continue
    const totals = sumEntries(list)

    // O orçamento é do projeto inteiro, não do período — compara com todas as
    // horas já lançadas nele, senão "18h de 15h" nunca apareceria num recorte.
    const allSeconds = sumEntries(
      closedEntries(db).filter((e) => e.project_id === project.id),
    ).seconds

    const budgetProgress = project.budget_seconds
      ? allSeconds / project.budget_seconds
      : null
    const overBy = project.budget_seconds
      ? Math.max(0, allSeconds - project.budget_seconds)
      : 0

    rows.push({ project, totals, budgetProgress, overBy })
  }

  return rows.sort((a, b) => b.totals.cents - a.totals.cents || b.totals.seconds - a.totals.seconds)
}

export interface DayGroup {
  dayKey: string
  entries: TimeEntry[]
  totals: Totals
}

/** Registros dia a dia, mais recente primeiro (§4.6). */
export function groupByDay(entries: TimeEntry[]): DayGroup[] {
  const map = new Map<string, TimeEntry[]>()

  for (const e of entries) {
    const key = dayKeyOf(e.started_at)
    const list = map.get(key)
    if (list) list.push(e)
    else map.set(key, [e])
  }

  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([dayKey, list]) => ({
      dayKey,
      entries: list.sort(
        (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
      ),
      totals: sumEntries(list),
    }))
}

/** Total lançado hoje — rodapé de contexto do Cronômetro (§4.1). */
export function todayTotals(db: Database): Totals {
  const today = dayKeyOf(new Date())
  return sumEntries(closedEntries(db).filter((e) => dayKeyOf(e.started_at) === today))
}

export function projectLabel(db: Database, projectId: string): {
  project?: Project
  client?: Client
  color: string
  name: string
  clientName: string
} {
  const project = db.projects.find((p) => p.id === projectId)
  const client = project ? db.clients.find((c) => c.id === project.client_id) : undefined
  return {
    project,
    client,
    color: client?.color ?? 'var(--text-3)',
    name: project?.name ?? 'Projeto removido',
    clientName: client?.name ?? '—',
  }
}
