import { useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Badge, Dot } from './ui'
import { formatMoney } from '../lib/money'
import { formatDuration, formatTime } from '../lib/time'
import { entryValue, projectLabel } from '../lib/calc'
import { useDb } from '../store/useStore'
import type { TimeEntry } from '../lib/types'

/**
 * Linha de registro (§6.5).
 * Toque abre a edição; deslizar para a esquerda revela Apagar.
 */
export function EntryRow({
  entry,
  isNew,
  onEdit,
  onDelete,
  showProject = true,
}: {
  entry: TimeEntry
  isNew?: boolean
  onEdit: () => void
  onDelete: () => void
  showProject?: boolean
}) {
  const db = useDb()
  const label = projectLabel(db, entry.project_id)
  const [swiped, setSwiped] = useState(false)
  const startX = useRef<number | null>(null)

  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX
  }

  function onPointerUp(e: React.PointerEvent) {
    if (startX.current === null) return
    const dx = e.clientX - startX.current
    startX.current = null
    if (dx < -48) setSwiped(true)
    else if (dx > 24) setSwiped(false)
  }

  const timeLabel = entry.ended_at
    ? `${formatTime(entry.started_at)}–${formatTime(entry.ended_at)}`
    : formatTime(entry.started_at)

  return (
    <div className={`entry-row${swiped ? ' is-swiped' : ''}`}>
      <button
        type="button"
        className="entry-delete"
        aria-label={`Apagar registro de ${label.name}`}
        onClick={() => {
          setSwiped(false)
          onDelete()
        }}
      >
        <Trash2 size={20} aria-hidden="true" />
      </button>

      <button
        type="button"
        className={`entry-row-inner${isNew ? ' is-new' : ''}`}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (startX.current = null)}
        onClick={() => {
          if (swiped) {
            setSwiped(false)
            return
          }
          onEdit()
        }}
      >
        {showProject && <Dot color={label.color} />}

        <span className="col grow" style={{ minWidth: 0, gap: 2 }}>
          {showProject && (
            <span className="t-body-strong truncate">{label.name}</span>
          )}
          <span className="row" style={{ gap: 'var(--space-2)' }}>
            <span className="t-mono c-2">{timeLabel}</span>
            <span className="t-caption c-3">{formatDuration(entry.duration_seconds, { short: true })}</span>
            {entry.invoiced && <Badge tone="success">Faturado</Badge>}
          </span>
          {entry.note && <span className="t-caption c-3 truncate">{entry.note}</span>}
        </span>

        <span className="t-mono c-1" style={{ flex: 'none' }}>
          {formatMoney(entryValue(entry), db.settings.currency)}
        </span>
      </button>
    </div>
  )
}
