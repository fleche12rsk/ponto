import type { Database } from './types'

/**
 * Último projeto cronometrado. Alimenta o atalho de dois toques do §2.2:
 * ao abrir o app, o seletor já vem preenchido com ele.
 *
 * Derivado dos próprios registros — nada de guardar mais um campo que possa
 * apontar para um projeto já apagado.
 */
export function lastUsedProjectId(db: Database): string | null {
  let bestId: string | null = null
  let bestTime = -Infinity

  for (const entry of db.entries) {
    const t = new Date(entry.created_at).getTime()
    if (t > bestTime && db.projects.some((p) => p.id === entry.project_id && !p.archived)) {
      bestTime = t
      bestId = entry.project_id
    }
  }

  if (bestId) return bestId

  // Sem registros ainda: se existe um único projeto, ele é a escolha óbvia.
  const active = db.projects.filter((p) => !p.archived)
  return active.length === 1 ? active[0].id : null
}
