import { Preferences } from '@capacitor/preferences'
import { EMPTY_DB, DEFAULT_SETTINGS, type Database } from './types'

/**
 * Persistência local. Sem servidor, sem login, sem sincronização (§9).
 *
 * Usa Capacitor Preferences, que no Android grava em SharedPreferences e no
 * navegador cai em localStorage — o mesmo código serve para o `npm run dev`
 * e para o APK. O volume de dados é pequeno (milhares de registros no pior
 * caso), então guardar o banco inteiro como um JSON é suficiente e evita a
 * complexidade de um SQLite para o v1.
 */

const KEY = 'horas.db.v1'

/** Serializa gravações para que dois saves concorrentes não se sobrescrevam. */
let writeChain: Promise<void> = Promise.resolve()

export async function loadDb(): Promise<Database> {
  try {
    const { value } = await Preferences.get({ key: KEY })
    if (!value) return structuredClone(EMPTY_DB)

    const parsed = JSON.parse(value) as Partial<Database>
    // Mescla defeitos de versões antigas com os padrões, para nunca cair em
    // undefined depois de uma atualização do app.
    return {
      version: parsed.version ?? 1,
      clients: parsed.clients ?? [],
      projects: parsed.projects ?? [],
      entries: parsed.entries ?? [],
      running: parsed.running ?? null,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
    }
  } catch {
    // Um JSON corrompido não pode impedir o app de abrir.
    return structuredClone(EMPTY_DB)
  }
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

export async function clearDb(): Promise<void> {
  await Preferences.remove({ key: KEY })
}

export function exportJson(db: Database): string {
  return JSON.stringify(db, null, 2)
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
