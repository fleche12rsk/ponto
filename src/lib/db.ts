import { Preferences } from '@capacitor/preferences'
import {
  EMPTY_DB,
  DEFAULT_SETTINGS,
  type Client,
  type Database,
  type Settings,
} from './types'

/**
 * Persistência local. Sem servidor, sem login, sem sincronização (§9).
 *
 * Usa Capacitor Preferences, que no Android grava em SharedPreferences e no
 * navegador cai em localStorage — o mesmo código serve para o `npm run dev`
 * e para o APK. O volume de dados é pequeno (milhares de registros no pior
 * caso), então guardar o banco inteiro como um JSON é suficiente e evita a
 * complexidade de um SQLite para o v1.
 */

const KEY = 'ponto.db.v1'

/** Versão atual do formato. Subir junto com uma migração em `migrate`. */
const SCHEMA_VERSION = 3

/** Serializa gravações para que dois saves concorrentes não se sobrescrevam. */
let writeChain: Promise<void> = Promise.resolve()

export async function loadDb(): Promise<Database> {
  try {
    const { value } = await Preferences.get({ key: KEY })
    if (!value) return structuredClone(EMPTY_DB)

    const parsed = JSON.parse(value) as Partial<Database>
    // Mescla defeitos de versões antigas com os padrões, para nunca cair em
    // undefined depois de uma atualização do app.
    return migrate({
      version: parsed.version ?? 1,
      clients: parsed.clients ?? [],
      projects: parsed.projects ?? [],
      entries: parsed.entries ?? [],
      running: parsed.running ?? null,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
    })
  } catch {
    // Um JSON corrompido não pode impedir o app de abrir.
    return structuredClone(EMPTY_DB)
  }
}

/**
 * Leva bancos antigos para o formato atual. Roda na leitura, então quem
 * atualiza o app não perde nada e não precisa fazer nada.
 */
function migrate(db: Database): Database {
  let next = db

  /*
    v1 → v2: o valor por hora saiu do cliente e passou a morar só no projeto.
    Projetos que herdavam a tarifa do cliente (rate_cents null) recebem agora
    o valor que o cliente tinha — o que eles já cobravam na prática, só que
    agora escrito no lugar certo.
  */
  if (next.version < 2) {
    const legacyRate = new Map<string, number>()
    for (const client of next.clients as (Client & { default_rate_cents?: number })[]) {
      if (typeof client.default_rate_cents === 'number') {
        legacyRate.set(client.id, client.default_rate_cents)
      }
    }

    next = {
      ...next,
      version: 2,
      clients: next.clients.map((c) => {
        const { ...rest } = c as Client & { default_rate_cents?: number }
        delete (rest as { default_rate_cents?: number }).default_rate_cents
        return rest as Client
      }),
      projects: next.projects.map((p) => ({
        ...p,
        rate_cents:
          typeof p.rate_cents === 'number'
            ? p.rate_cents
            : (legacyRate.get(p.client_id) ?? next.settings.default_rate_cents),
      })),
    }
  }

  /*
    v2 → v3: o campo único "contato" virou e-mail e telefone separados. Um
    campo só obrigava a aceitar qualquer texto, e era por isso que dava para
    digitar letra onde deveria entrar número.
  */
  if (next.version < 3) {
    const legacy = (next.settings as Settings & { freelancer_contact?: string })
      .freelancer_contact
    const settings = { ...next.settings }
    delete (settings as { freelancer_contact?: string }).freelancer_contact

    // O que estava lá era texto livre: se tem "@" é e-mail, senão telefone.
    if (legacy && !settings.freelancer_email && !settings.freelancer_phone) {
      if (legacy.includes('@')) settings.freelancer_email = legacy
      else settings.freelancer_phone = legacy.replace(/\D/g, '')
    }

    next = { ...next, version: 3, settings }
  }

  return next.version === SCHEMA_VERSION ? next : { ...next, version: SCHEMA_VERSION }
}

export function saveDb(db: Database): Promise<void> {
  writeChain = writeChain.then(() =>
    Preferences.set({ key: KEY, value: JSON.stringify(db) }).then(
      () => undefined,
      () => undefined,
    ),
  )
  return writeChain
}

/**
 * Resolve quando toda gravação pendente terminou. Quem precisa ler o disco
 * logo depois de uma mudança — o widget, por exemplo — espera por isto.
 */
export function flushWrites(): Promise<void> {
  return writeChain
}

export async function clearDb(): Promise<void> {
  await Preferences.remove({ key: KEY })
}

export function exportJson(db: Database): string {
  return JSON.stringify(db, null, 2)
}

/**
 * Lê um backup e devolve o banco, ou lança com uma mensagem em português.
 *
 * Um backup é o único caminho de volta quando alguém troca de celular ou
 * apaga o app sem querer. Se o arquivo estiver corrompido, o app precisa
 * dizer isso claramente em vez de importar metade e sobrescrever o resto.
 */
export function parseBackup(raw: string): Database {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Esse arquivo não é um backup do Ponto.')
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Esse arquivo não é um backup do Ponto.')
  }

  const candidate = parsed as Partial<Database>
  const listas = ['clients', 'projects', 'entries'] as const
  for (const chave of listas) {
    if (!Array.isArray(candidate[chave])) {
      throw new Error('Esse arquivo não é um backup do Ponto.')
    }
  }

  // Passa pela mesma migração da leitura normal: um backup antigo é tão
  // válido quanto um banco antigo.
  return migrate({
    version: candidate.version ?? 1,
    clients: candidate.clients ?? [],
    projects: candidate.projects ?? [],
    entries: candidate.entries ?? [],
    running: candidate.running ?? null,
    settings: { ...DEFAULT_SETTINGS, ...(candidate.settings ?? {}) },
  })
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
