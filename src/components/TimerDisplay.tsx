import { useEffect, useRef, useState } from 'react'
import { formatClock, formatDuration } from '../lib/time'
import type { TimerState } from '../lib/types'

/* ============================================================
   Display do cronômetro (§6.6)
   HH:MM primário + :SS menor e secundário, mono tabular.
   ============================================================ */

export function TimerDisplay({
  seconds,
  state,
  longAfterHours,
}: {
  seconds: number
  /** null = nenhum timer (estado zerado). */
  state: TimerState | null
  longAfterHours: number
}) {
  const { hhmm, ss, hours } = formatClock(seconds)
  const isRunning = state === 'running'
  const isPaused = state === 'paused'
  const isLong = hours >= longAfterHours

  const cls = [
    'timer-display',
    state === null && 'is-idle',
    isPaused && 'is-paused',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cls}>
      <span className={`t-timer timer-hours${isLong ? ' is-long' : ''}`}>{hhmm}</span>
      <span className={`t-timer-sec timer-seconds${isRunning ? ' is-running' : ''}`}>:{ss}</span>
      {isPaused && (
        <span className="pause-mark t-timer-sec c-3" aria-hidden="true" style={{ marginLeft: 6 }}>
          ▍
        </span>
      )}
      {/* O leitor de tela recebe marcos (a cada minuto), não cada segundo (§11). */}
      <TimerAnnouncer seconds={seconds} active={isRunning} />
    </div>
  )
}

function TimerAnnouncer({ seconds, active }: { seconds: number; active: boolean }) {
  const [announced, setAnnounced] = useState('')
  const lastMinute = useRef(-1)

  useEffect(() => {
    if (!active) return
    const minute = Math.floor(seconds / 60)
    if (minute !== lastMinute.current && minute > 0) {
      lastMinute.current = minute
      setAnnounced(formatDuration(minute * 60))
    }
  }, [seconds, active])

  return (
    <span
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        overflow: 'hidden',
        clipPath: 'inset(50%)',
        whiteSpace: 'nowrap',
      }}
    >
      {announced}
    </span>
  )
}
