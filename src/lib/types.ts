/**
 * Modelo de dados: §9 do documento base.
 *
 * Convenções que valem para todo o app:
 *  - dinheiro em CENTAVOS (inteiro), nunca float;
 *  - duração em SEGUNDOS (inteiro);
 *  - data/hora em ISO 8601 com offset, para sobreviver a mudança de fuso
 *    e a horário de verão.
 */

export const CLIENT_COLORS = [
  { name: 'Índigo', hex: '#6C7BFF' },
  { name: 'Rosa', hex: '#F26D9C' },
  { name: 'Turquesa', hex: '#3FC7C0' },
  { name: 'Azul-aço', hex: '#4F9DDE' },
  { name: 'Verde-musgo', hex: '#7FB069' },
  { name: 'Terracota', hex: '#E08A5B' },
  { name: 'Violeta', hex: '#B085F5' },
  { name: 'Areia', hex: '#D4A94E' },
] as const

export interface Client {
  id: string
  name: string
  /** Uma das 8 cores fixas de CLIENT_COLORS. */
  color: string
  created_at: string
  archived: boolean
}

export interface Project {
  id: string
  client_id: string
  name: string
  /**
   * O valor por hora mora aqui e em nenhum outro lugar.
   *
   * O mesmo cliente costuma contratar serviços diferentes — site e motion,
   * por exemplo — que valem preços diferentes. Uma tarifa por cliente
   * obrigaria a inventar exceções; uma tarifa por projeto já é a resposta.
   */
  rate_cents: number
  /** Horas orçadas, em segundos. null = sem orçamento. */
  budget_seconds: number | null
  created_at: string
  archived: boolean
}

export type EntrySource = 'timer' | 'manual'

export interface TimeEntry {
  id: string
  project_id: string
  started_at: string
  ended_at: string | null
  duration_seconds: number
  note: string | null
  source: EntrySource
  invoiced: boolean
  /**
   * Valor/hora congelado no momento do registro. Garante que relatórios
   * antigos continuem corretos se a tarifa do cliente mudar depois.
   */
  rate_cents_snapshot: number
  created_at: string
  updated_at: string
}

export type TimerState = 'running' | 'paused'

export interface RunningTimer {
  project_id: string
  /** Início do trecho atual (não do registro inteiro). */
  started_at: string
  /** Soma dos trechos anteriores à pausa atual. */
  accumulated_seconds: number
  state: TimerState
  paused_at: string | null
}

export type ThemePref = 'light' | 'dark' | 'system'
export type WeekStart = 'sunday' | 'monday'

export interface Settings {
  /** Preenche o campo de valor ao criar um projeto novo. */
  default_rate_cents: number
  currency: string
  week_start: WeekStart
  theme: ThemePref
  notif_long_timer_hours: number
  notif_end_of_day: boolean
  /** Cabeçalho do PDF (§10): quem assina o relatório. */
  freelancer_name: string
  freelancer_email: string
  /** Só os dígitos. A formatação `(47) 93380-1234` é do campo, não do dado. */
  freelancer_phone: string
}

export interface Database {
  version: number
  clients: Client[]
  projects: Project[]
  entries: TimeEntry[]
  running: RunningTimer | null
  settings: Settings
}

export const DEFAULT_SETTINGS: Settings = {
  default_rate_cents: 0,
  currency: 'BRL',
  week_start: 'monday',
  theme: 'system',
  notif_long_timer_hours: 6,
  notif_end_of_day: true,
  freelancer_name: '',
  freelancer_email: '',
  freelancer_phone: '',
}

export const EMPTY_DB: Database = {
  version: 3,
  clients: [],
  projects: [],
  entries: [],
  running: null,
  settings: DEFAULT_SETTINGS,
}
