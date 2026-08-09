import { useState } from 'react'
import { Sheet } from '../components/Sheet'
import { Button, Field, Segmented } from '../components/ui'
import {
  currentMonth,
  currentWeek,
  customPeriod,
  dayKeyOf,
  type Period,
} from '../lib/time'
import { useDb } from '../store/useStore'

/** Escolher período (§6.3): Semana | Mês | Personalizado. */
export function PeriodSheet({
  period,
  onChange,
  onClose,
}: {
  period: Period
  onChange: (p: Period) => void
  onClose: () => void
}) {
  const db = useDb()
  const [kind, setKind] = useState<Period['kind']>(period.kind)
  const [from, setFrom] = useState(dayKeyOf(period.start))
  const [to, setTo] = useState(dayKeyOf(period.end))

  function apply() {
    if (kind === 'week') onChange(currentWeek(db.settings.week_start))
    else if (kind === 'month') onChange(currentMonth())
    else onChange(customPeriod(from <= to ? from : to, from <= to ? to : from))
    onClose()
  }

  return (
    <Sheet
      title="Escolher período"
      onClose={onClose}
      footer={
        <>
          <Button variant="text" onClick={onClose}>
            Cancelar
          </Button>
          <div className="grow" />
          <Button onClick={apply}>Aplicar</Button>
        </>
      }
    >
      <Segmented<Period['kind']>
        label="Tipo de período"
        value={kind}
        onChange={setKind}
        options={[
          { value: 'week', label: 'Semana' },
          { value: 'month', label: 'Mês' },
          { value: 'custom', label: 'Personalizado' },
        ]}
      />

      {kind === 'custom' && (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <Field label="De">
            <div className="field-box">
              <input
                className="field-input"
                type="date"
                value={from}
                aria-label="Data inicial"
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
          </Field>
          <Field label="Até">
            <div className="field-box">
              <input
                className="field-input"
                type="date"
                value={to}
                aria-label="Data final"
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </Field>
        </div>
      )}
    </Sheet>
  )
}
