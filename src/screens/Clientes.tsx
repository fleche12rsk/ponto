import { useMemo, useState } from 'react'
import { ChevronRight, Plus, Search } from 'lucide-react'
import { Button, Dot, Empty } from '../components/ui'
import { ClientSheet } from '../sheets/ClientSheet'
import { ProjectSheet } from '../sheets/ProjectSheet'
import { useDb } from '../store/useStore'
import { closedEntries, sumEntries } from '../lib/calc'
import { currentMonth, formatDuration, isInPeriod } from '../lib/time'

/** Clientes — lista (§4.7). */
export function Clientes({ onOpenClient }: { onOpenClient: (clientId: string) => void }) {
  const db = useDb()
  const [newClient, setNewClient] = useState(false)
  const [newProjectFor, setNewProjectFor] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const month = useMemo(() => currentMonth(), [])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const monthEntries = closedEntries(db).filter((e) => isInPeriod(e.started_at, month))

    return db.clients
      .filter((c) => !c.archived && (!q || c.name.toLowerCase().includes(q)))
      .map((client) => {
        const projectIds = new Set(
          db.projects.filter((p) => p.client_id === client.id).map((p) => p.id),
        )
        const totals = sumEntries(monthEntries.filter((e) => projectIds.has(e.project_id)))
        return { client, projectCount: projectIds.size, totals }
      })
      .sort((a, b) => b.totals.seconds - a.totals.seconds || a.client.name.localeCompare(b.client.name))
  }, [db, query, month])

  return (
    <section className="screen">
      <header className="screen-header">
        <h1 className="t-h1 grow">Clientes</h1>
        <button
          type="button"
          className="icon-btn"
          aria-label="Novo cliente"
          onClick={() => setNewClient(true)}
        >
          <Plus size={24} aria-hidden="true" />
        </button>
      </header>

      <div className="screen-body">
        {db.clients.length === 0 ? (
          <Empty
            title="Você ainda não tem clientes."
            body="Cada cliente ganha uma cor, e é ela que identifica as horas dele no resto do app."
            action={<Button onClick={() => setNewClient(true)}>Criar primeiro cliente</Button>}
          />
        ) : (
          <>
            {db.clients.length > 8 && (
              <div className="field-box" style={{ marginBottom: 'var(--space-4)' }}>
                <Search size={20} className="c-3" aria-hidden="true" />
                <input
                  className="field-input"
                  value={query}
                  placeholder="Buscar cliente"
                  aria-label="Buscar cliente"
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            )}

            {rows.map(({ client, projectCount, totals }) => (
              <button
                key={client.id}
                type="button"
                className="client-card"
                style={{ '--client-color': client.color } as React.CSSProperties}
                onClick={() => onOpenClient(client.id)}
              >
                <Dot color={client.color} />
                <span className="col grow" style={{ minWidth: 0 }}>
                  <span className="t-body-strong truncate">{client.name}</span>
                  <span className="t-caption c-3 truncate">
                    {projectCount === 0
                      ? 'Nenhum projeto'
                      : `${projectCount} ${projectCount === 1 ? 'projeto' : 'projetos'}`}
                    {' · '}
                    {totals.seconds > 0
                      ? `${formatDuration(totals.seconds)} no mês`
                      : 'Sem horas este mês'}
                  </span>
                </span>
                <ChevronRight size={20} className="c-3" aria-hidden="true" />
              </button>
            ))}
          </>
        )}
      </div>

      {newClient && (
        <ClientSheet
          onClose={() => setNewClient(false)}
          onSaved={(client) => setNewProjectFor(client.id)}
        />
      )}

      {newProjectFor && (
        <ProjectSheet
          clientId={newProjectFor}
          title="Criar um projeto"
          onClose={() => setNewProjectFor(null)}
        />
      )}
    </section>
  )
}
