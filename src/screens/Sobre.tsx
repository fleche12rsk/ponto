import { ArrowLeft } from 'lucide-react'
import { APP_VERSION } from '../lib/version'

/** Sobre (§4.12) — sóbrio, uma tela. */
export function Sobre({ onBack }: { onBack: () => void }) {
  return (
    <section className="stack-screen">
      <header className="screen-header">
        <button type="button" className="icon-btn" aria-label="Voltar" onClick={onBack}>
          <ArrowLeft size={24} aria-hidden="true" />
        </button>
        <h1 className="t-h1 grow">Sobre</h1>
      </header>

      <div className="screen-body">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-4)',
            padding: 'var(--space-8) 0',
          }}
        >
          <AppMark />
          <h2 className="t-h1">Horas</h2>
          <p className="t-body c-2" style={{ textAlign: 'center', maxWidth: '32ch' }}>
            Controle de tempo para freelancers.
          </p>
          <p className="t-caption c-3">Versão {APP_VERSION}</p>
        </div>

        <hr className="divider" />

        <p className="t-body c-2" style={{ textAlign: 'center', padding: 'var(--space-5) 0' }}>
          Feito por{' '}
          <a href="https://micio.dev" target="_blank" rel="noreferrer noopener">
            micio.dev
          </a>
        </p>
      </div>
    </section>
  )
}

/** O mesmo glifo do ícone do app: os dois pontos do relógio (§12). */
function AppMark() {
  return (
    <svg
      width="72"
      height="72"
      viewBox="0 0 72 72"
      role="img"
      aria-label="Marca do Horas"
      style={{ borderRadius: 18, background: 'var(--bg)', border: '1px solid var(--line)' }}
    >
      <circle cx="36" cy="26" r="5" fill="var(--amber-fill)" />
      <circle cx="36" cy="46" r="5" fill="var(--amber-fill)" />
    </svg>
  )
}
