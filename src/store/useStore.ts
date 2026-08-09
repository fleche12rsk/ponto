import { useEffect, useState, useSyncExternalStore } from 'react'
import { getState, subscribe, elapsedSeconds } from './store'
import type { Database } from '../lib/types'

export function useDb(): Database {
  return useSyncExternalStore(subscribe, getState, getState)
}

/**
 * Segundos do cronômetro, atualizados a cada segundo enquanto roda.
 * O valor vem sempre de `started_at`, então voltar do segundo plano mostra
 * o tempo certo no primeiro quadro — sem "recuperar" nada.
 */
export function useElapsed(): number {
  const db = useDb()
  const running = db.running
  const [seconds, setSeconds] = useState(() => elapsedSeconds(db))

  useEffect(() => {
    setSeconds(elapsedSeconds(getState()))
    if (!running || running.state !== 'running') return

    const id = window.setInterval(() => {
      setSeconds(elapsedSeconds(getState()))
    }, 1000)

    // Voltar do segundo plano recalcula na hora, sem esperar o próximo tick.
    const onVisible = () => {
      if (!document.hidden) setSeconds(elapsedSeconds(getState()))
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [running?.project_id, running?.state, running?.started_at, running])

  return seconds
}
