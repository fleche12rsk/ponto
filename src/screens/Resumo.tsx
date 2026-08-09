import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Bar, Dot, Empty, Segmented } from '../components/ui'
import { Dialog } from '../components/Sheet'
import { EntryRow } from '../components/EntryRow'
import { PeriodSheet } from '../sheets/PeriodSheet'
import { ManualEntrySheet } from '../sheets/ManualEntrySheet'
import { toast } from '../components/Toast'
import { useDb } from '../store/useStore'
import { deleteEntry } from '../store/store'
import {
  breakdownByClient,
  entriesInPeriod,
  groupByDay,
  sumEntries,
  type Scope,
} from '../lib/calc'
import { formatMoney } from '../lib/money'
import {
  currentMonth,
  formatDayHeader,
  formatDuration,
  periodLabel,
  shiftPeriod,
  type Period,
} from '../lib/time'
import type { TimeEntry } from '../lib/types'

type View = 'resumo' | 'historico'

/**
 * Resumo (§4.5) e Histórico (§4.6) — sub-visões da mesma aba, porque quase
 * sempre se chega no histórico a partir de um total que se quer detalhar.
 */
export function Resumo({
  newEntryId,
  onOpenClient,
}: {
  newEntryId: string | null
  onOpenClient: (clientId: string, period: Period) => void
}) {
  const db = useDb()
  const [view, setView] = useState<View>('resumo')
  const [period, setPeriod] = useState<Period>(() => currentMonth())
  const [scope, setScope] = useState<Scope>('unbilled')
  const [pickingPeriod, setPickingPeriod] = useState(false)
  const [editing, setEditing] = useState<TimeEntry | null>(null)
  const [deleting, setDeleting] = useState<TimeEntry | null>(null)

  const entries = useMemo(
    () => entriesInPeriod(db, period, scope),
    [db, period, scope],
  )
  const totals = useMemo(() => sumEntries(entries), [entries])
  const clients = useMemo(() => breakdownByClient(db, entries), [db, entries])
  const days = useMemo(() => groupByDay(entries), [entries])

  return (
    <section className="screen">
      <header className="screen-header">
        <h1 className="t-h1 grow">Resumo</h1>
      </header>

      <div style={{ padding: '0 var(--space-4) var(--space-4)' }}>
        <Segmented<View>
          label="Visão"
          value={view}
          onChange={setView}
          options={[
            { value: 'resumo', label: 'Resumo' },
            { value: 'historico', label: 'Histórico' },
          ]}
        />
      </div>

      {/* Seletor de período */}
      <div className="row" style={{ padding: '0 var(--space-4) var(--space-4)' }}>
        <button
          type="button"
          className="icon-btn"
          aria-label="Período anterior"
          onClick={() => setPeriod(shiftPeriod(period, -1, db.settings.week_start))}
        >
          <ChevronLeft size={22} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="row grow center"
          style={{ minHeight: 48, justifyContent: 'center', gap: 'var(--space-2)' }}
          onClick={() => setPickingPeriod(true)}
          aria-label={`Período: ${periodLabel(period)}. Trocar.`}
        >
          <Calendar size={18} className="c-3" aria-hidden="true" />
          <span className="t-label truncate">{periodLabel(period)}</span>
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label="Próximo período"
          onClick={() => setPeriod(shiftPeriod(period, 1, db.settings.week_start))}
        >
          <ChevronRight size={22} aria-hidden="true" />
        </button>
      </div>

      <div className="screen-body">
        {/* Par de totais — o que o olho procura (§4.5). */}
        <div
          className="total-pair"
          style={{ padding: 'var(--space-2) 0 var(--space-5)' }}
        >
          <div className="col">
            <span className="t-micro c-3">Horas</span>
            <span className="t-display">
              {totals.seconds > 0 ? formatDuration(totals.seconds, { short: true }) : '0h'}
            </span>
          </div>
          <div className="col">
            <span className="t-micro c-3">Valor</span>
            <span className="t-display-money c-amber">
              {formatMoney(totals.cents, db.settings.currency)}
            </span>
          </div>
        </div>

        <div style={{ marginBottom: 'var(--space-5)' }}>
          <Segmented<Scope>
            label="Escopo"
            value={scope}
            onChange={setScope}
            options={[
              { value: 'unbilled', label: 'A cobrar' },
              { value: 'invoiced', label: 'Faturado' },
              { value: 'all', label: 'Tudo' },
            ]}
          />
        </div>

        {entries.length === 0 && (
          <Empty
            title="Nenhuma hora neste período."
            body="Quando você registrar horas, o total aparece aqui."
          />
        )}

        {view === 'resumo' &&
          clients.map(({ client, totals: t, share }) => (
            <button
              key={client.id}
              type="button"
              className="client-card"
              style={{ '--client-color': client.color } as React.CSSProperties}
              onClick={() => onOpenClient(client.id, period)}
            >
              <span className="col grow" style={{ gap: 'var(--space-2)' }}>
                <span className="row between">
                  <span className="row" style={{ minWidth: 0 }}>
                    <Dot color={client.color} />
                    <span className="t-body-strong truncate">{client.name}</span>
                  </span>
                  <span className="t-mono c-1">{formatMoney(t.cents, db.settings.currency)}</span>
                </span>
                <Bar
                  value={share}
                  color={client.color}
                  animated
                  label={`${Math.round(share * 100)}% do período`}
                />
                <span className="t-caption c-3">{formatDuration(t.seconds)}</span>
              </span>
            </button>
          ))}

        {view === 'historico' &&
          days.map((day) => (
            <section key={day.dayKey}>
              <div className="day-header">
                <h2 className="t-h2 c-3">{formatDayHeader(day.dayKey)}</h2>
                <span className="t-caption c-3">{formatDuration(day.totals.seconds)}</span>
              </div>
              {day.entries.map((entry) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  isNew={entry.id === newEntryId}
                  onEdit={() => setEditing(entry)}
                  onDelete={() => setDeleting(entry)}
                />
              ))}
            </section>
          ))}

        {view === 'resumo' && entries.length > 0 && (
          <p className="t-caption c-3" style={{ marginTop: 'var(--space-5)', textAlign: 'center' }}>
            Toque num cliente para ver os projetos e gerar o relatório.
          </p>
        )}
      </div>

      {pickingPeriod && (
        <PeriodSheet
          period={period}
          onChange={setPeriod}
          onClose={() => setPickingPeriod(false)}
        />
      )}

      {editing && (
        <ManualEntrySheet
          entry={editing}
          onClose={() => setEditing(null)}
          onSaved={() => toast('Registro salvo')}
        />
      )}

      {deleting && (
        <Dialog
          title="Apagar este registro?"
          body="Essa ação não pode ser desfeita."
          cancelLabel="Cancelar"
          confirmLabel="Apagar"
          destructive
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            deleteEntry(deleting.id)
            setDeleting(null)
            toast('Registro apagado')
          }}
        />
      )}
    </section>
  )
}
