import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { TimerDisplay } from '../components/TimerDisplay'
import { Button, Dot, Empty } from '../components/ui'
import { toast } from '../components/Toast'
import { ClientSheet } from '../sheets/ClientSheet'
import { ProjectSheet } from '../sheets/ProjectSheet'
import { PickProjectSheet } from '../sheets/PickProjectSheet'
import { FinishSheet } from '../sheets/FinishSheet'
import { ManualEntrySheet } from '../sheets/ManualEntrySheet'
import { useDb, useElapsed } from '../store/useStore'
import {
  discardTimer,
  pauseTimer,
  resumeTimer,
  startTimer,
  stopTimer,
} from '../store/store'
import { projectLabel, todayTotals } from '../lib/calc'
import { formatDuration } from '../lib/time'
import { lastUsedProjectId } from '../lib/recent'

type SheetKind = 'pick' | 'finish' | 'manual' | 'new-client' | 'new-project' | null

/**
 * Agora — tela principal do cronômetro (§4.1).
 * Hierarquia: timer → projeto → botão de ação → total do dia.
 */
export function Agora({ onNewEntry }: { onNewEntry: (entryId: string) => void }) {
  const db = useDb()
  const elapsed = useElapsed()
  const running = db.running

  const [selected, setSelected] = useState<string | null>(() => lastUsedProjectId(db))
  const [sheet, setSheet] = useState<SheetKind>(null)
  const [newClientId, setNewClientId] = useState<string | null>(null)
  const [showBgChip, setShowBgChip] = useState(false)
  const [pulse, setPulse] = useState(false)

  const activeProjectId = running?.project_id ?? selected
  const label = activeProjectId ? projectLabel(db, activeProjectId) : null
  const today = todayTotals(db)
  const hasClients = db.clients.length > 0
  const hasProjects = db.projects.some((p) => !p.archived)

  // Se o projeto selecionado sumiu (apagado noutra tela), volta ao mais recente.
  useEffect(() => {
    if (selected && !db.projects.some((p) => p.id === selected)) {
      setSelected(lastUsedProjectId(db))
    }
  }, [db, selected])

  // Selo "Contando em segundo plano": aparece, fica 2s, some (§2.2).
  useEffect(() => {
    if (running?.state !== 'running') {
      setShowBgChip(false)
      return
    }
    setShowBgChip(true)
    const id = window.setTimeout(() => setShowBgChip(false), 2000)
    return () => window.clearTimeout(id)
  }, [running?.state, running?.project_id])

  function handleStart() {
    if (!activeProjectId) return
    startTimer(activeProjectId)
  }

  function handleSave(note: string) {
    const entry = stopTimer(note)
    setSheet(null)
    if (entry) {
      setSelected(entry.project_id)
      onNewEntry(entry.id)
      toast('Registro salvo')
    }
  }

  function handleDiscard() {
    discardTimer()
    setSheet(null)
  }

  /* ---------- Estado vazio: sem clientes (§4.1) ---------- */
  if (!hasClients) {
    return (
      <section className="screen">
        <div className="screen-body">
          <Empty
            title="Comece a medir seu tempo"
            body="Crie um cliente e um projeto para dar o primeiro play."
            action={
              <Button onClick={() => setSheet('new-client')}>Criar primeiro cliente</Button>
            }
          />
        </div>
        {sheet === 'new-client' && (
          <ClientSheet
            onClose={() => setSheet(null)}
            onSaved={(client) => {
              setNewClientId(client.id)
              setSheet('new-project')
            }}
          />
        )}
        {sheet === 'new-project' && newClientId && (
          <ProjectSheet
            clientId={newClientId}
            title="Criar um projeto"
            onClose={() => setSheet(null)}
            onSaved={(project) => {
              setSelected(project.id)
              setPulse(true)
              window.setTimeout(() => setPulse(false), 700)
            }}
          />
        )}
      </section>
    )
  }

  return (
    <section className="screen">
      <header className="screen-header">
        <h1 className="t-h1 grow">Agora</h1>
        <button
          type="button"
          className="icon-btn"
          aria-label="Lançar horas"
          onClick={() => setSheet('manual')}
        >
          <Plus size={24} aria-hidden="true" />
        </button>
      </header>

      <div className="screen-body" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Bloco do timer — respiro generoso, é tela-momento (§5.5). */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-5)',
            paddingTop: 'var(--space-6)',
            paddingBottom: 'var(--space-8)',
            minHeight: 260,
          }}
        >
          <TimerDisplay
            seconds={elapsed}
            state={running?.state ?? null}
            longAfterHours={db.settings.notif_long_timer_hours}
          />

          {showBgChip && (
            <span className="bg-chip t-caption">Contando em segundo plano</span>
          )}

          {/* Card do projeto ativo — toque troca de projeto. */}
          <button
            type="button"
            className="row"
            style={{
              maxWidth: '100%',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              minHeight: 48,
            }}
            onClick={() => setSheet('pick')}
            aria-label={
              label ? `Projeto ${label.name}, cliente ${label.clientName}. Trocar.` : 'Escolher projeto'
            }
          >
            {label && <Dot color={label.color} />}
            <span className="col" style={{ textAlign: 'left', minWidth: 0 }}>
              <span className="t-body-strong truncate">
                {label ? label.name : 'Escolher projeto'}
              </span>
              {label && <span className="t-caption c-3 truncate">{label.clientName}</span>}
            </span>
          </button>
        </div>

        {/* Zona de ação, alcance do polegar (§11). */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {!running && (
            <>
              <Button
                size="lg"
                block
                pulsing={pulse}
                disabled={!activeProjectId}
                onClick={handleStart}
              >
                Começar
              </Button>
              {!activeProjectId && (
                <p className="t-caption c-3" style={{ textAlign: 'center' }}>
                  {hasProjects
                    ? 'Escolha um projeto para começar'
                    : 'Crie um projeto para começar'}
                </p>
              )}
            </>
          )}

          {running?.state === 'running' && (
            <div className="row" style={{ gap: 'var(--space-3)' }}>
              <div className="grow">
                <Button size="lg" variant="secondary" block onClick={pauseTimer}>
                  Pausar
                </Button>
              </div>
              <div className="grow">
                <Button size="lg" block onClick={() => setSheet('finish')}>
                  Encerrar
                </Button>
              </div>
            </div>
          )}

          {running?.state === 'paused' && (
            <div className="row" style={{ gap: 'var(--space-3)' }}>
              <div className="grow">
                <Button size="lg" variant="secondary" block onClick={() => setSheet('finish')}>
                  Encerrar
                </Button>
              </div>
              <div className="grow">
                <Button size="lg" block onClick={resumeTimer}>
                  Retomar
                </Button>
              </div>
            </div>
          )}

          <p className="t-caption c-3" style={{ textAlign: 'center', marginTop: 'var(--space-2)' }}>
            Hoje: {today.seconds > 0 ? formatDuration(today.seconds) : '—'}
          </p>
        </div>
      </div>

      {sheet === 'pick' && (
        <PickProjectSheet
          onPick={(id) => setSelected(id)}
          onClose={() => setSheet(null)}
        />
      )}

      {sheet === 'finish' && running && (
        <FinishSheet
          seconds={elapsed}
          projectId={running.project_id}
          onSave={handleSave}
          onDiscard={handleDiscard}
          onClose={() => setSheet(null)}
        />
      )}

      {sheet === 'manual' && (
        <ManualEntrySheet
          onClose={() => setSheet(null)}
          onSaved={(id) => {
            onNewEntry(id)
            toast('Registro salvo')
          }}
        />
      )}
    </section>
  )
}
