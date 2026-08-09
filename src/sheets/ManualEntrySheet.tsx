import { useMemo, useState } from 'react'
import { Sheet } from '../components/Sheet'
import { Button, Dot, Field, PickerField, Segmented, TextArea, TextField } from '../components/ui'
import { PickProjectSheet } from './PickProjectSheet'
import {
  combineDateTime,
  formatDuration,
  parseHoursToSeconds,
  toDateInput,
  toTimeInput,
} from '../lib/time'
import { projectLabel } from '../lib/calc'
import { useDb } from '../store/useStore'
import { addManualEntry, updateEntry } from '../store/store'
import type { TimeEntry } from '../lib/types'
import { lastUsedProjectId } from '../lib/recent'

type Mode = 'range' | 'duration'

const DAY_SECONDS = 24 * 60 * 60

/**
 * Lançar horas manual (§4.4) e editar um registro existente (§4.6).
 *
 * Duas formas de dizer a mesma coisa: início e fim, ou duração direta —
 * porque nem sempre a pessoa lembra os horários exatos.
 */
export function ManualEntrySheet({
  entry,
  onClose,
  onSaved,
}: {
  entry?: TimeEntry
  onClose: () => void
  onSaved?: (entryId: string) => void
}) {
  const db = useDb()

  const [projectId, setProjectId] = useState<string | null>(
    entry?.project_id ?? lastUsedProjectId(db),
  )
  const [mode, setMode] = useState<Mode>('range')
  const [date, setDate] = useState(
    entry ? toDateInput(entry.started_at) : toDateInput(new Date()),
  )
  const [start, setStart] = useState(entry ? toTimeInput(entry.started_at) : '09:00')
  const [end, setEnd] = useState(
    entry?.ended_at ? toTimeInput(entry.ended_at) : '12:00',
  )
  const [durationText, setDurationText] = useState(
    entry ? formatDuration(entry.duration_seconds, { short: true }) : '',
  )
  const [note, setNote] = useState(entry?.note ?? '')
  const [picking, setPicking] = useState(false)
  const [touched, setTouched] = useState(false)

  const label = projectId ? projectLabel(db, projectId) : null

  /** Duração calculada ao vivo: o usuário confere sem fazer conta (§4.4). */
  const computed = useMemo(() => {
    if (mode === 'duration') {
      const seconds = parseHoursToSeconds(durationText)
      return { seconds, crossesMidnight: false, parseFailed: durationText.trim() !== '' && seconds === null }
    }

    const startAt = combineDateTime(date, start)
    const endAt = combineDateTime(date, end)
    let seconds = Math.round((endAt.getTime() - startAt.getTime()) / 1000)
    let crossesMidnight = false

    // Fim antes do início = virou a meia-noite. É nota, não erro (§4.4).
    if (seconds < 0) {
      seconds += DAY_SECONDS
      crossesMidnight = true
    }
    return { seconds, crossesMidnight, parseFailed: false }
  }, [mode, date, start, end, durationText])

  const seconds = computed.seconds
  const tooLong = seconds !== null && seconds > DAY_SECONDS
  const projectError = touched && !projectId ? 'Escolha um projeto.' : null
  const durationError = tooLong
    ? 'A duração passa de 24h. Confira os horários.'
    : computed.parseFailed
      ? 'Não entendi. Tente "3h30".'
      : touched && (seconds === null || seconds <= 0)
        ? 'Informe quanto tempo você trabalhou.'
        : null

  function save() {
    setTouched(true)
    if (!projectId || seconds === null || seconds <= 0 || tooLong) return

    let startedAt: Date
    let endedAt: Date

    if (mode === 'range') {
      startedAt = combineDateTime(date, start)
      endedAt = combineDateTime(date, end)
      if (computed.crossesMidnight) endedAt.setDate(endedAt.getDate() + 1)
    } else {
      // Sem horários, ancora no início do expediente daquele dia.
      startedAt = combineDateTime(date, start)
      endedAt = new Date(startedAt.getTime() + seconds * 1000)
    }

    if (entry) {
      updateEntry(entry.id, {
        project_id: projectId,
        started_at: startedAt.toISOString(),
        ended_at: endedAt.toISOString(),
        duration_seconds: seconds,
        note: note.trim() || null,
      })
      onSaved?.(entry.id)
    } else {
      const created = addManualEntry({
        project_id: projectId,
        started_at: startedAt.toISOString(),
        ended_at: endedAt.toISOString(),
        note: note.trim() || null,
      })
      if (created) onSaved?.(created.id)
    }
    onClose()
  }

  if (picking) {
    return (
      <PickProjectSheet
        onPick={(id) => setProjectId(id)}
        onClose={() => setPicking(false)}
      />
    )
  }

  return (
    <Sheet
      title={entry ? 'Editar registro' : 'Lançar horas'}
      onClose={onClose}
      footer={
        <>
          <Button variant="text" onClick={onClose}>
            Cancelar
          </Button>
          <div className="grow" />
          <Button onClick={save}>Salvar</Button>
        </>
      }
    >
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Segmented<Mode>
          label="Como informar o tempo"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'range', label: 'Início e fim' },
            { value: 'duration', label: 'Duração' },
          ]}
        />
      </div>

      <PickerField
        label="Projeto"
        value={label ? `${label.name} · ${label.clientName}` : null}
        placeholder="Escolher projeto"
        onClick={() => setPicking(true)}
        leading={label ? <Dot color={label.color} /> : undefined}
      />
      {projectError && (
        <span className="field-error t-caption" style={{ display: 'block', marginTop: 4 }}>
          {projectError}
        </span>
      )}

      <Field label="Data">
        <div className="field-box">
          <input
            className="field-input"
            type="date"
            value={date}
            aria-label="Data"
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </Field>

      {mode === 'range' ? (
        <div className="row" style={{ alignItems: 'flex-start', gap: 'var(--space-3)' }}>
          <div className="grow">
            <Field label="Início">
              <div className="field-box">
                <input
                  className="field-input"
                  type="time"
                  value={start}
                  aria-label="Hora de início"
                  onChange={(e) => setStart(e.target.value)}
                />
              </div>
            </Field>
          </div>
          <div className="grow">
            <Field label="Fim">
              <div className="field-box">
                <input
                  className="field-input"
                  type="time"
                  value={end}
                  aria-label="Hora de fim"
                  onChange={(e) => setEnd(e.target.value)}
                />
              </div>
            </Field>
          </div>
        </div>
      ) : (
        <TextField
          label="Duração"
          value={durationText}
          placeholder="Ex.: 3h30"
          inputMode="text"
          onChange={(e) => setDurationText(e.target.value)}
        />
      )}

      {/* Duração calculada, grande, abaixo dos campos (§4.4). */}
      <div style={{ marginTop: 'var(--space-5)' }}>
        <p className={`t-display ${durationError ? 'c-3' : ''}`}>
          {seconds && seconds > 0 && !tooLong ? formatDuration(seconds) : '—'}
        </p>
        {computed.crossesMidnight && !durationError && (
          <p className="t-caption c-3" style={{ marginTop: 4 }}>
            Termina no dia seguinte
          </p>
        )}
        {durationError && (
          <p className="t-caption c-danger" style={{ marginTop: 4 }}>
            {durationError}
          </p>
        )}
      </div>

      <div style={{ marginTop: 'var(--space-4)' }}>
        <TextArea
          label="Nota"
          value={note}
          placeholder="O que você fez? (opcional)"
          autoCapitalize="sentences"
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
    </Sheet>
  )
}
