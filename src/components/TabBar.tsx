import { BarChart3, Settings, Timer, Users } from 'lucide-react'

/* ============================================================
   Barra de abas (§6.7): 4 abas, sem badge numérico.
   ============================================================ */

export type Tab = 'agora' | 'resumo' | 'clientes' | 'ajustes'

const TABS: { id: Tab; label: string; Icon: typeof Timer }[] = [
  { id: 'agora', label: 'Agora', Icon: Timer },
  { id: 'resumo', label: 'Resumo', Icon: BarChart3 },
  { id: 'clientes', label: 'Clientes', Icon: Users },
  { id: 'ajustes', label: 'Ajustes', Icon: Settings },
]

export function TabBar({
  active,
  onChange,
}: {
  active: Tab
  onChange: (tab: Tab) => void
}) {
  return (
    <nav className="tabbar" aria-label="Navegação principal">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className="tabbar-item"
          aria-current={active === id ? 'page' : undefined}
          onClick={() => onChange(id)}
        >
          <Icon size={19} strokeWidth={active === id ? 2 : 1.75} aria-hidden="true" />
          <span className="t-micro">{label}</span>
        </button>
      ))}
    </nav>
  )
}
