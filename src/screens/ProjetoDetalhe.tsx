import { useMemo, useState } from 'react'
import { ArrowLeft, Pencil } from 'lucide-react'
import { Bar, Button, Dot, Empty } from '../components/ui'
import { Dialog } from '../components/Sheet'
import { EntryRow } from '../components/EntryRow'
import { ProjectSheet } from '../sheets/ProjectSheet'
import { ManualEntrySheet } from '../sheets/ManualEntrySheet'
import { toast } from '../components/Toast'
import { useDb } from '../store/useStore'
import { deleteEntry, deleteProject } from '../store/store'
import { closedEntries, effectiveRate, groupByDay, sumEntries } from '../lib/calc'
import { formatMoney } from '../lib/money'
import { formatDayHeader, formatDuration } from '../lib/time'
import type { TimeEntry } from '../lib/types'

/** Detalhe do projeto (§4.9): orçado × trabalhado e todos os registros. */
export function ProjetoDetalhe({
  projectId,
  onBack,
}: {
  projectId: string
  onBack: () => void
}) {
  const db = useDb()
  const project = db.projects.find((p) => p.id === projectId)
  const client = project ? db.clients.find((c) => c.id === project.client_id) : undefined

  const [editing, setEditing] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const [deletingEntry, setDeletingEntry] = useState<TimeEntry | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const entries = useMemo(
    () => closedEntries(db).filter((e) => e.project_id === projectId),
    [db, projectId],
  )
  const totals = useMemo(() => sumEntries(entries), [entries])
  const days = useMemo(() => groupByDay(entries), [entries])

  if (!project) {
    return (
      <section className="stack-screen">
        <header className="screen-header">
          <button type="button" className="icon-btn" aria-label="Voltar" onClick={onBack}>
            <ArrowLeft size={24} aria-hidden="true" />
          </button>
        </header>
        <div className="screen-body">
          <Empty title="Projeto não encontrado." />
        </div>
      </section>
    )
  }

  const rate = effectiveRate(project)
  const budget = project.budget_seconds
  const progress = budget ? totals.seconds / budget : null
  const overBy = budget ? Math.max(0, totals.seconds - budget) : 0

  return (
    <section className="stack-screen">
      <header className="screen-header">
        <button type="button" className="icon-btn" aria-label="Voltar" onClick={onBack}>
          <ArrowLeft size={24} aria-hidden="true" />
        </button>
        <div className="grow col" style={{ minWidth: 0 }}>
          <h1 className="t-h1 truncate">{project.name}</h1>
          {client && (
            <span className="row" style={{ gap: 'var(--space-2)' }}>
              <Dot color={client.color} small />
              <span className="t-caption c-3 truncate">{client.name}</span>
            </span>
          )}
        </div>
        <button
          type="button"
          className="icon-btn"
          aria-label="Editar projeto"
          onClick={() => setEditing(true)}
        >
          <Pencil size={22} aria-hidden="true" />
        </button>
      </header>

      <div className="screen-body">
        <div className="total-pair" style={{ marginBottom: 'var(--space-4)' }}>
          <div className="col">
            <span className="t-micro c-3">Trabalhado</span>
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

        {budget && progress !== null && client && (
          <div className="col" style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <Bar
              value={progress}
              color={client.color}
              over={overBy > 0}
              label={`${Math.round(progress * 100)}% do orçado`}
            />
            <span className="t-caption c-3">
              {formatDuration(totals.seconds)} de {formatDuration(budget)} orçadas
            </span>
            {/* Estouro é informação, não erro: clay, sem vermelho (§6.10). */}
            {overBy > 0 && (
              <span className="t-caption c-warn">{formatDuration(overBy)} acima do orçado</span>
            )}
          </div>
        )}

        <p className="t-caption c-3">
          Valor por hora: {formatMoney(rate, db.settings.currency)}
        </p>

        <div className="section">
          <h2 className="t-h2 c-3 section-title">Registros</h2>
          {entries.length === 0 && <p className="t-body c-2">Sem horas neste projeto.</p>}
          {days.map((day) => (
            <section key={day.dayKey}>
              <div className="day-header">
                <h3 className="t-h2 c-3">{formatDayHeader(day.dayKey)}</h3>
                <span className="t-caption c-3">{formatDuration(day.totals.seconds)}</span>
              </div>
              {day.entries.map((entry) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  showProject={false}
                  onEdit={() => setEditingEntry(entry)}
                  onDelete={() => setDeletingEntry(entry)}
                />
              ))}
            </section>
          ))}
        </div>

        <div className="section">
          <Button variant="danger" block onClick={() => setConfirmDelete(true)}>
            Apagar projeto
          </Button>
        </div>
      </div>

      {editing && (
        <ProjectSheet
          clientId={project.client_id}
          project={project}
          onClose={() => setEditing(false)}
        />
      )}

      {editingEntry && (
        <ManualEntrySheet
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSaved={() => toast('Registro salvo')}
        />
      )}

      {deletingEntry && (
        <Dialog
          title="Apagar este registro?"
          body="Essa ação não pode ser desfeita."
          cancelLabel="Cancelar"
          confirmLabel="Apagar"
          destructive
          onCancel={() => setDeletingEntry(null)}
          onConfirm={() => {
            deleteEntry(deletingEntry.id)
            setDeletingEntry(null)
            toast('Registro apagado')
          }}
        />
      )}

      {confirmDelete && (
        <Dialog
          title={`Apagar ${project.name}?`}
          body="Todos os registros deste projeto também serão apagados."
          cancelLabel="Cancelar"
          confirmLabel="Apagar"
          destructive
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            deleteProject(project.id)
            setConfirmDelete(false)
            onBack()
            toast('Projeto apagado')
          }}
        />
      )}
    </section>
  )
}
