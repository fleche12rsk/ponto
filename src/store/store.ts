import { loadDb, saveDb, clearDb, uid } from '../lib/db'
import { effectiveRate } from '../lib/calc'
import {
  EMPTY_DB,
  type Client,
  type Database,
  type Project,
  type Settings,
  type TimeEntry,
} from '../lib/types'

/**
 * Store único do app. Observável simples em cima de `useSyncExternalStore` —
 * o estado é pequeno e as mutações são poucas, então um Redux/Zustand seria
 * peso morto aqui. Toda mutação grava no disco de forma assíncrona.
 */

type Listener = () => void

let state: Database = structuredClone(EMPTY_DB)
let ready = false
const listeners = new Set<Listener>()

function emit() {
  for (const l of listeners) l()
}

function commit(next: Database) {
  state = next
  emit()
  void saveDb(next)
}

/** Aplica uma transformação imutável ao banco. */
function mutate(fn: (db: Database) => Database) {
  commit(fn(state))
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getState(): Database {
  return state
}

export function isReady(): boolean {
  return ready
}

export async function initStore(): Promise<void> {
  const loaded = await loadDb()
  state = loaded
  ready = true
  emit()

  /*
    `loadDb` migra na leitura, mas em memória. Gravar de volta na hora evita
    que o formato antigo continue no disco esperando a próxima escrita — o
    que deixaria o banco meio migrado se o app fosse fechado antes.
  */
  void saveDb(loaded)
}

const now = () => new Date().toISOString()

/* ============================================================
   Clientes
   ============================================================ */

export function addClient(input: { name: string; color: string }): Client {
  const client: Client = {
    id: uid(),
    name: input.name.trim(),
    color: input.color,
    created_at: now(),
    archived: false,
  }
  mutate((db) => ({ ...db, clients: [...db.clients, client] }))
  return client
}

export function updateClient(id: string, patch: Partial<Omit<Client, 'id'>>) {
  mutate((db) => ({
    ...db,
    clients: db.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)),
  }))
}

/** Apaga o cliente, seus projetos e todos os registros deles (cascata, §9). */
export function deleteClient(id: string) {
  mutate((db) => {
    const projectIds = new Set(db.projects.filter((p) => p.client_id === id).map((p) => p.id))
    const running = db.running && projectIds.has(db.running.project_id) ? null : db.running
    return {
      ...db,
      running,
      clients: db.clients.filter((c) => c.id !== id),
      projects: db.projects.filter((p) => p.client_id !== id),
      entries: db.entries.filter((e) => !projectIds.has(e.project_id)),
    }
  })
}

/* ============================================================
   Projetos
   ============================================================ */

export function addProject(input: {
  client_id: string
  name: string
  rate_cents: number
  budget_seconds: number | null
}): Project {
  const project: Project = {
    id: uid(),
    client_id: input.client_id,
    name: input.name.trim(),
    rate_cents: input.rate_cents,
    budget_seconds: input.budget_seconds,
    created_at: now(),
    archived: false,
  }
  mutate((db) => ({ ...db, projects: [...db.projects, project] }))
  return project
}

export function updateProject(id: string, patch: Partial<Omit<Project, 'id' | 'client_id'>>) {
  mutate((db) => ({
    ...db,
    projects: db.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
  }))
}

export function deleteProject(id: string) {
  mutate((db) => ({
    ...db,
    running: db.running?.project_id === id ? null : db.running,
    projects: db.projects.filter((p) => p.id !== id),
    entries: db.entries.filter((e) => e.project_id !== id),
  }))
}

/* ============================================================
   Cronômetro
   ============================================================ */

/**
 * Segundos decorridos. Calculado sempre a partir de `started_at` real —
 * nunca acumulado por tick — para que fechar o app, apagar a tela ou o
 * WebView ser descartado não perca tempo nenhum (§2.2).
 */
export function elapsedSeconds(db: Database = state, at = Date.now()): number {
  const r = db.running
  if (!r) return 0
  if (r.state === 'paused') return r.accumulated_seconds
  const delta = Math.floor((at - new Date(r.started_at).getTime()) / 1000)
  return r.accumulated_seconds + Math.max(0, delta)
}

export function startTimer(projectId: string) {
  mutate((db) => ({
    ...db,
    running: {
      project_id: projectId,
      started_at: now(),
      accumulated_seconds: 0,
      state: 'running',
      paused_at: null,
    },
  }))
}

export function pauseTimer() {
  mutate((db) => {
    if (!db.running || db.running.state === 'paused') return db
    return {
      ...db,
      running: {
        ...db.running,
        accumulated_seconds: elapsedSeconds(db),
        state: 'paused',
        paused_at: now(),
      },
    }
  })
}

export function resumeTimer() {
  mutate((db) => {
    if (!db.running || db.running.state === 'running') return db
    return {
      ...db,
      running: { ...db.running, started_at: now(), state: 'running', paused_at: null },
    }
  })
}

export function discardTimer() {
  mutate((db) => ({ ...db, running: null }))
}

/** Encerra o cronômetro e grava o registro. Retorna o registro criado. */
export function stopTimer(note: string | null): TimeEntry | null {
  const db = state
  if (!db.running) return null

  const duration = elapsedSeconds(db)
  const endedAt = new Date()
  const startedAt = new Date(endedAt.getTime() - duration * 1000)

  const project = db.projects.find((p) => p.id === db.running!.project_id)
  if (!project) {
    mutate((d) => ({ ...d, running: null }))
    return null
  }

  const entry: TimeEntry = {
    id: uid(),
    project_id: project.id,
    started_at: startedAt.toISOString(),
    ended_at: endedAt.toISOString(),
    duration_seconds: duration,
    note: note?.trim() ? note.trim() : null,
    source: 'timer',
    invoiced: false,
    rate_cents_snapshot: effectiveRate(project),
    created_at: now(),
    updated_at: now(),
  }

  mutate((d) => ({ ...d, running: null, entries: [...d.entries, entry] }))
  return entry
}

/* ============================================================
   Registros
   ============================================================ */

export function addManualEntry(input: {
  project_id: string
  started_at: string
  ended_at: string
  note: string | null
}): TimeEntry | null {
  const db = state
  const project = db.projects.find((p) => p.id === input.project_id)
  if (!project) return null

  const duration = Math.round(
    (new Date(input.ended_at).getTime() - new Date(input.started_at).getTime()) / 1000,
  )

  const entry: TimeEntry = {
    id: uid(),
    project_id: input.project_id,
    started_at: input.started_at,
    ended_at: input.ended_at,
    duration_seconds: Math.max(0, duration),
    note: input.note?.trim() ? input.note.trim() : null,
    source: 'manual',
    invoiced: false,
    rate_cents_snapshot: effectiveRate(project),
    created_at: now(),
    updated_at: now(),
  }

  mutate((d) => ({ ...d, entries: [...d.entries, entry] }))
  return entry
}

export function updateEntry(id: string, patch: Partial<Omit<TimeEntry, 'id'>>) {
  mutate((db) => ({
    ...db,
    entries: db.entries.map((e) =>
      e.id === id ? { ...e, ...patch, updated_at: now() } : e,
    ),
  }))
}

export function deleteEntry(id: string) {
  mutate((db) => ({ ...db, entries: db.entries.filter((e) => e.id !== id) }))
}

export function setInvoiced(ids: string[], invoiced: boolean) {
  const set = new Set(ids)
  mutate((db) => ({
    ...db,
    entries: db.entries.map((e) =>
      set.has(e.id) ? { ...e, invoiced, updated_at: now() } : e,
    ),
  }))
}

/* ============================================================
   Ajustes
   ============================================================ */

export function updateSettings(patch: Partial<Settings>) {
  mutate((db) => ({ ...db, settings: { ...db.settings, ...patch } }))
}

export async function eraseEverything() {
  await clearDb()
  commit(structuredClone(EMPTY_DB))
}

/** Substitui tudo pelo conteúdo de um backup. Sem volta. */
export function replaceAll(db: Database) {
  commit(db)
}

/**
 * Relê o disco sem gravar nada.
 *
 * O widget de início rápido também escreve no armazenamento, então o app
 * deixou de ser o único autor dos dados. Ao voltar do segundo plano ele
 * precisa reler — senão a próxima gravação sobrescreveria com o estado que
 * ficou parado em memória, e o cronômetro iniciado pelo widget sumiria.
 */
export async function reloadFromDisk(): Promise<void> {
  const fresh = await loadDb()
  state = fresh
  emit()
}
