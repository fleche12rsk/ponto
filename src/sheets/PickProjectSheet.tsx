import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Sheet } from '../components/Sheet'
import { Badge, Button, Dot } from '../components/ui'
import { useDb } from '../store/useStore'
import { lastUsedProjectId } from '../lib/recent'
import { ClientSheet } from './ClientSheet'
import { ProjectSheet } from './ProjectSheet'

/**
 * Escolher projeto (§4.2). Agrupado por cliente, com busca só quando a lista
 * passa de 8 projetos — abaixo disso a busca só ocuparia espaço.
 */
export function PickProjectSheet({
  onPick,
  onClose,
}: {
  onPick: (projectId: string) => void
  onClose: () => void
}) {
  const db = useDb()
  const [query, setQuery] = useState('')
  const [newClient, setNewClient] = useState(false)
  const [newProjectFor, setNewProjectFor] = useState<string | null>(null)

  const active = useMemo(() => db.projects.filter((p) => !p.archived), [db.projects])
  const showSearch = active.length > 8
  const recentId = lastUsedProjectId(db)

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    return db.clients
      .filter((c) => !c.archived)
      .map((client) => ({
        client,
        projects: active.filter(
          (p) =>
            p.client_id === client.id &&
            (!q ||
              p.name.toLowerCase().includes(q) ||
              client.name.toLowerCase().includes(q)),
        ),
      }))
      .filter((g) => g.projects.length > 0)
  }, [db.clients, active, query])

  const recent = recentId ? active.find((p) => p.id === recentId) : undefined
  const recentClient = recent ? db.clients.find((c) => c.id === recent.client_id) : undefined

  if (newClient) {
    return (
      <ClientSheet
        onClose={() => setNewClient(false)}
        onSaved={(client) => setNewProjectFor(client.id)}
      />
    )
  }

  if (newProjectFor) {
    return (
      <ProjectSheet
        clientId={newProjectFor}
        onClose={() => setNewProjectFor(null)}
        onSaved={(project) => {
          onPick(project.id)
          onClose()
        }}
      />
    )
  }

  return (
    <Sheet
      title="Escolher projeto"
      onClose={onClose}
      footer={
        db.clients.length > 0 ? (
          <Button
            variant="secondary"
            block
            onClick={() => setNewProjectFor(db.clients[0].id)}
          >
            <Plus size={18} aria-hidden="true" /> Novo projeto
          </Button>
        ) : undefined
      }
    >
      {showSearch && (
        <div className="field-box" style={{ marginBottom: 'var(--space-4)' }}>
          <Search size={20} className="c-3" aria-hidden="true" />
          <input
            className="field-input"
            value={query}
            placeholder="Buscar projeto"
            aria-label="Buscar projeto"
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      )}

      {db.clients.length === 0 && (
        <div style={{ padding: 'var(--space-4) 0' }}>
          <p className="t-body c-2" style={{ marginBottom: 'var(--space-4)' }}>
            Você ainda não tem clientes.
          </p>
          <Button block onClick={() => setNewClient(true)}>
            Criar primeiro cliente
          </Button>
        </div>
      )}

      {recent && recentClient && !query && (
        <section style={{ marginBottom: 'var(--space-5)' }}>
          <button
            type="button"
            className="option-row"
            onClick={() => {
              onPick(recent.id)
              onClose()
            }}
          >
            <Dot color={recentClient.color} />
            <span className="grow col">
              <span className="t-body-strong truncate">{recent.name}</span>
              <span className="t-caption c-3 truncate">{recentClient.name}</span>
            </span>
            <Badge tone="amber">Recente</Badge>
          </button>
        </section>
      )}

      {groups.map(({ client, projects }) => (
        <section key={client.id} style={{ marginBottom: 'var(--space-5)' }}>
          <div className="row" style={{ marginBottom: 'var(--space-2)' }}>
            <Dot color={client.color} small />
            <h3 className="t-h2 c-3 truncate">{client.name}</h3>
          </div>
          {projects.map((project) => (
            <button
              key={project.id}
              type="button"
              className="option-row"
              onClick={() => {
                onPick(project.id)
                onClose()
              }}
            >
              <span className="grow truncate t-body">{project.name}</span>
            </button>
          ))}
        </section>
      ))}

      {db.clients.length > 0 && groups.length === 0 && (
        <p className="t-body c-2" style={{ padding: 'var(--space-4) 0' }}>
          {query ? 'Nenhum projeto com esse nome.' : 'Nenhum projeto ainda.'}
        </p>
      )}
    </Sheet>
  )
}
