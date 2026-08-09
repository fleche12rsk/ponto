import type { WeekStart } from './types'

/* ============================================================
   Tempo: formatação, cálculo e períodos
   ============================================================ */

const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0')

/** `HH:MM:SS` com horas sem teto (pode passar de 24). Para o cronômetro. */
export function formatClock(totalSeconds: number): {
  hhmm: string
  ss: string
  hours: number
} {
  const s = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(s / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const seconds = s % 60
  return { hhmm: `${pad(hours)}:${pad(minutes)}`, ss: pad(seconds), hours }
}

/** `3h 30min`: leitura humana. Para durações em listas e totais. */
export function formatDuration(totalSeconds: number, opts?: { short?: boolean }): string {
  const s = Math.max(0, Math.round(totalSeconds))
  const hours = Math.floor(s / 3600)
  const minutes = Math.round((s % 3600) / 60)
  // 59min59s vira 1h, nunca "0h 60min".
  const h = minutes === 60 ? hours + 1 : hours
  const m = minutes === 60 ? 0 : minutes

  if (opts?.short) {
    if (h === 0) return `${m}min`
    if (m === 0) return `${h}h`
    return `${h}h${pad(m)}`
  }
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

/** `14:00` no fuso local. */
export function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** `03/08` */
export function formatDayMonth(iso: string): string {
  const d = new Date(iso)
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`
}

const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

/** `Hoje`, `Ontem` ou `quarta, 6 de agosto`: cabeçalho de dia no histórico. */
export function formatDayHeader(dayKey: string): string {
  const today = dayKeyOf(new Date())
  if (dayKey === today) return 'Hoje'

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (dayKey === dayKeyOf(yesterday)) return 'Ontem'

  const d = dateFromDayKey(dayKey)
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`
}

/** `01–31 de agosto de 2026`: subtítulo de período e cabeçalho do PDF (§10). */
export function formatRange(startIso: string, endIso: string): string {
  const a = new Date(startIso)
  const b = new Date(endIso)
  const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()

  if (sameMonth) {
    return `${pad(a.getDate())}–${pad(b.getDate())} de ${MONTHS[a.getMonth()]} de ${a.getFullYear()}`
  }
  if (a.getFullYear() === b.getFullYear()) {
    return `${pad(a.getDate())} de ${MONTHS[a.getMonth()]} – ${pad(b.getDate())} de ${MONTHS[b.getMonth()]} de ${a.getFullYear()}`
  }
  return `${pad(a.getDate())}/${pad(a.getMonth() + 1)}/${a.getFullYear()} – ${pad(b.getDate())}/${pad(b.getMonth() + 1)}/${b.getFullYear()}`
}

/* ---------- Chaves de dia (agrupamento local, sem UTC) ---------- */

/** `2026-08-09` no fuso LOCAL: agrupar por UTC jogaria registros da noite para o dia seguinte. */
export function dayKeyOf(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function dateFromDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** `2026-08-09` para o `value` de um `<input type="date">`. */
export const toDateInput = dayKeyOf

/** `14:30` para o `value` de um `<input type="time">`. */
export function toTimeInput(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Junta data e hora dos inputs num Date local. */
export function combineDateTime(dateStr: string, timeStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  const [hh, mm] = timeStr.split(':').map(Number)
  return new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0)
}

/* ---------- Períodos (§4.5) ---------- */

export interface Period {
  kind: 'week' | 'month' | 'custom'
  /** Início do primeiro dia, 00:00:00 local. */
  start: string
  /** Fim do último dia, 23:59:59.999 local. */
  end: string
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function endOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

export function currentWeek(weekStart: WeekStart, ref = new Date()): Period {
  const firstDow = weekStart === 'monday' ? 1 : 0
  const start = startOfDay(ref)
  const diff = (start.getDay() - firstDow + 7) % 7
  start.setDate(start.getDate() - diff)
  const end = endOfDay(new Date(start))
  end.setDate(start.getDate() + 6)
  return { kind: 'week', start: start.toISOString(), end: endOfDay(end).toISOString() }
}

export function currentMonth(ref = new Date()): Period {
  const start = startOfDay(new Date(ref.getFullYear(), ref.getMonth(), 1))
  const end = endOfDay(new Date(ref.getFullYear(), ref.getMonth() + 1, 0))
  return { kind: 'month', start: start.toISOString(), end: end.toISOString() }
}

export function customPeriod(startDayKey: string, endDayKey: string): Period {
  return {
    kind: 'custom',
    start: startOfDay(dateFromDayKey(startDayKey)).toISOString(),
    end: endOfDay(dateFromDayKey(endDayKey)).toISOString(),
  }
}

export function shiftPeriod(p: Period, direction: -1 | 1, weekStart: WeekStart): Period {
  const ref = new Date(p.start)
  if (p.kind === 'week') {
    ref.setDate(ref.getDate() + 7 * direction)
    return currentWeek(weekStart, ref)
  }
  if (p.kind === 'month') {
    ref.setMonth(ref.getMonth() + direction)
    return currentMonth(ref)
  }
  // Período personalizado desloca pela própria largura.
  const span = new Date(p.end).getTime() - new Date(p.start).getTime()
  const start = new Date(new Date(p.start).getTime() + (span + 1) * direction)
  const end = new Date(new Date(p.end).getTime() + (span + 1) * direction)
  return { kind: 'custom', start: start.toISOString(), end: end.toISOString() }
}

export function isInPeriod(iso: string, p: Period): boolean {
  const t = new Date(iso).getTime()
  return t >= new Date(p.start).getTime() && t <= new Date(p.end).getTime()
}

/* ---------- Entrada de duração digitada ---------- */

/**
 * Lê horas digitadas em linguagem solta: `15`, `15h`, `15h30`, `15:30`,
 * `15,5`, `90min`. Retorna segundos, ou null se não der para entender.
 */
export function parseHoursToSeconds(input: string): number | null {
  const raw = input.trim().toLowerCase().replace(/\s/g, '')
  if (!raw) return null

  const onlyMinutes = raw.match(/^(\d+)(?:min|m)$/)
  if (onlyMinutes) return Number(onlyMinutes[1]) * 60

  const hoursAndMinutes = raw.match(/^(\d+)[h:](\d{1,2})m?i?n?$/)
  if (hoursAndMinutes) {
    const h = Number(hoursAndMinutes[1])
    const m = Number(hoursAndMinutes[2])
    if (m > 59) return null
    return h * 3600 + m * 60
  }

  const wholeHours = raw.match(/^(\d+)h?$/)
  if (wholeHours) return Number(wholeHours[1]) * 3600

  const decimalHours = raw.match(/^(\d+)[.,](\d+)h?$/)
  if (decimalHours) {
    const value = Number(`${decimalHours[1]}.${decimalHours[2]}`)
    return Math.round(value * 3600)
  }

  return null
}

/** Rótulo curto do período, para o cabeçalho do Resumo. */
export function periodLabel(p: Period): string {
  if (p.kind === 'month') {
    const d = new Date(p.start)
    const name = MONTHS[d.getMonth()]
    return `${name.charAt(0).toUpperCase()}${name.slice(1)} de ${d.getFullYear()}`
  }
  return formatRange(p.start, p.end)
}
