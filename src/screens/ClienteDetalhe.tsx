import { useMemo, useState } from 'react'
import { ArrowLeft, ChevronRight, FileText, Pencil, Plus } from 'lucide-react'
import { Bar, Button, Dot, Empty } from '../components/ui'
import { Dialog } from '../components/Sheet'
import { ClientSheet } from '../sheets/ClientSheet'
import { ProjectSheet } from '../sheets/ProjectSheet'
import { PeriodSheet } from '../sheets/PeriodSheet'
import { toast } from '../components/Toast'
import { useDb } from '../store/useStore'
import { deleteClient } from '../store/store'
import { breakdownByProject, entriesInPeriod, sumEntries } from '../lib/calc'
import { formatMoney } from '../lib/money'
import { formatDuration, periodLabel, type Period } from '../lib/time'

/** Detalhe do cliente (§4.8). */
export function ClienteDetalhe({
  clientId,
  period,
  onBack,
  onOpenProject,
  onReport,
  onPeriodChange,
}: {
  clientId: string
  period: Period
  onBack: () => void
  onOpenProject: (projectId: string) => void
  onReport: () => void
  onPeriodChange: (p: Period) => void
}) {
  const db = useDb()
  const client = db.clients.find((c) => c.id === clientId)

  const [editing, setEditing] = useState(false)
  const [newProject, setNewProject] = useState(false)
  const [pickingPeriod, setPickingPeriod] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const entries = useMemo(() => {
    const projectIds = new Set(
      db.projects.filter((p) => p.client_id === clientId).map((p) => p.id),
    )
    return entriesInPeriod(db, period, 'all').filter((e) => projectIds.has(e.project_id))
  }, [db, clientId, period])

  const totals = useMemo(() => sumEntries(entries), [entries])
  const projects = useMemo(
    () => breakdownByProject(db, entries, clientId),
    [db, entries, clientId],
  )

  if (!client) {
    // O cliente pode ter sido apagado enquanto a tela estava aberta.
    return (
      <section className="stack-screen">
        <header className="screen-header">
          <button type="button" className="icon-btn" aria-label="Voltar" onClick={onBack}>
            <ArrowLeft size={24} aria-hidden="true" />
          </button>
        </header>
        <div className="screen-body">
          <Empty title="Cliente não encontrado." />
        </div>
      </section>
    )
  }

  return (
    <section className="stack-screen">
      <header className="screen-header">
        <button type="button" className="icon-btn" aria-label="Voltar" onClick={onBack}>
          <ArrowLeft size={24} aria-hidden="true" />
        </button>
        <div className="grow row" style={{ minWidth: 0 }}>
          <Dot color={client.color} />
          <h1 className="t-h1 truncate">{client.name}</h1>
        </div>
        <button
          type="button"
          className="icon-btn"
          aria-label="Editar cliente"
          onClick={() => setEditing(true)}
        >
          <Pencil size={22} aria-hidden="true" />
        </button>
      </header>

      <div className="screen-body">
        <button
          type="button"
          className="row"
          style={{ minHeight: 40, marginBottom: 'var(--space-4)' }}
          onClick={() => setPickingPeriod(true)}
        >
          <span className="t-label c-2">{periodLabel(period)}</span>
          <ChevronRight size={16} className="c-3" aria-hidden="true" />
        </button>

        <div className="total-pair" style={{ marginBottom: 'var(--space-5)' }}>
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

        <p className="t-caption c-3" style={{ marginBottom: 'var(--space-5)' }}>
          Valor por hora do cliente: {formatMoney(client.default_rate_cents, db.settings.currency)}
        </p>

        <Button block onClick={onReport}>
          <FileText size={18} aria-hidden="true" /> Gerar relatório
        </Button>

        <div className="section">
          <div className="row between" style={{ marginBottom: 'var(--space-3)' }}>
            <h2 className="t-h2 c-3">Projetos</h2>
            <button
              type="button"
              className="icon-btn"
              aria-label="Novo projeto"
              onClick={() => setNewProject(true)}
            >
              <Plus size={22} aria-hidden="true" />
            </button>
          </div>

          {projects.length === 0 && (
            <p className="t-body c-2">Nenhum projeto ainda.</p>
          )}

          {projects.map(({ project, totals: t, budgetProgress, overBy }) => (
            <button
              key={project.id}
              type="button"
              className="client-card"
              style={{ '--client-color': client.color } as React.CSSProperties}
              onClick={() => onOpenProject(project.id)}
            >
              <span className="col grow" style={{ gap: 'var(--space-2)', minWidth: 0 }}>
                <span className="row between">
                  <span className="t-body-strong truncate">{project.name}</span>
                  <span className="t-mono c-1">{formatMoney(t.cents, db.settings.currency)}</span>
                </span>

                {budgetProgress !== null && (
                  <Bar
                    value={budgetProgress}
                    color={client.color}
                    over={overBy > 0}
                    label={`${Math.round(budgetProgress * 100)}% do orçado`}
                  />
                )}

                <span className="t-caption c-3">
                  {formatDuration(t.seconds)}
                  {project.budget_seconds
                    ? ` · orçado ${formatDuration(project.budget_seconds)}`
                    : ''}
                </span>

                {overBy > 0 && (
                  <span className="t-caption c-warn">
                    {formatDuration(overBy)} acima do orçado
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>

        <div className="section">
          <Button variant="danger" block onClick={() => setConfirmDelete(true)}>
            Apagar cliente
          </Button>
        </div>
      </div>

      {editing && <ClientSheet client={client} onClose={() => setEditing(false)} />}

      {newProject && (
        <ProjectSheet clientId={client.id} onClose={() => setNewProject(false)} />
      )}

      {pickingPeriod && (
        <PeriodSheet
          period={period}
          onChange={onPeriodChange}
          onClose={() => setPickingPeriod(false)}
        />
      )}

      {confirmDelete && (
        <Dialog
          title={`Apagar ${client.name} e seus projetos?`}
          body="Todos os registros deste cliente também serão apagados."
          cancelLabel="Cancelar"
          confirmLabel="Apagar tudo"
          destructive
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            deleteClient(client.id)
            setConfirmDelete(false)
            onBack()
            toast('Cliente apagado')
          }}
        />
      )}
    </section>
  )
}
