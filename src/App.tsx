import { useCallback, useEffect, useState } from 'react'
import { App as CapApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'

import { TabBar, type Tab } from './components/TabBar'
import { ToastLayer } from './components/Toast'
import { Agora } from './screens/Agora'
import { Resumo } from './screens/Resumo'
import { Clientes } from './screens/Clientes'
import { Ajustes } from './screens/Ajustes'
import { Sobre } from './screens/Sobre'
import { Licencas } from './screens/Licencas'
import { ClienteDetalhe } from './screens/ClienteDetalhe'
import { ProjetoDetalhe } from './screens/ProjetoDetalhe'
import { Relatorio } from './screens/Relatorio'

import { useDb } from './store/useStore'
import { handleBack } from './lib/backstack'
import { currentMonth, type Period } from './lib/time'
import { syncEndOfDayReminder, syncTimerNotifications } from './lib/notifications'

/** Telas empilhadas: as que aprofundam e têm botão de voltar (§3). */
type StackEntry =
  | { kind: 'client'; clientId: string }
  | { kind: 'project'; projectId: string }
  | { kind: 'report'; clientId: string }
  | { kind: 'about' }
  | { kind: 'licenses' }

export function App() {
  const db = useDb()
  const [tab, setTab] = useState<Tab>('agora')
  const [stack, setStack] = useState<StackEntry[]>([])
  const [period, setPeriod] = useState<Period>(() => currentMonth())
  const [newEntryId, setNewEntryId] = useState<string | null>(null)

  const push = useCallback((entry: StackEntry) => setStack((s) => [...s, entry]), [])
  const pop = useCallback(() => setStack((s) => s.slice(0, -1)), [])

  /* ---------- Tema (§4.11) ---------- */
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)')

    function apply() {
      const pref = db.settings.theme
      const resolved = pref === 'system' ? (media.matches ? 'light' : 'dark') : pref
      document.documentElement.dataset.theme = resolved

      const bg = resolved === 'light' ? '#F7F5F0' : '#12110E'
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg)

      if (Capacitor.isNativePlatform()) {
        // A barra de status acompanha o fundo do app (§11).
        void StatusBar.setBackgroundColor({ color: bg }).catch(() => {})
        void StatusBar.setStyle({
          style: resolved === 'light' ? Style.Light : Style.Dark,
        }).catch(() => {})
      }
    }

    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [db.settings.theme])

  /* ---------- Splash: some assim que a primeira tela está pronta (§12) ---------- */
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    void SplashScreen.hide().catch(() => {})
  }, [])

  /* ---------- Notificações ---------- */
  useEffect(() => {
    void syncTimerNotifications(db)
  }, [db.running?.project_id, db.running?.state, db.settings.notif_long_timer_hours, db])

  useEffect(() => {
    void syncEndOfDayReminder(db)
  }, [db.settings.notif_end_of_day, db])

  /* ---------- Voltar do Android ---------- */
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const listener = CapApp.addListener('backButton', () => {
      // Primeiro fecha o que estiver por cima: diálogo, depois folha.
      if (handleBack()) return
      if (stack.length > 0) {
        pop()
        return
      }
      if (tab !== 'agora') {
        setTab('agora')
        return
      }
      void CapApp.exitApp()
    })

    return () => {
      void listener.then((l) => l.remove())
    }
  }, [stack.length, tab, pop])

  /* Destaca o registro recém-salvo por um instante e depois esquece (§7). */
  const flagNewEntry = useCallback((entryId: string) => {
    setNewEntryId(entryId)
    window.setTimeout(() => setNewEntryId(null), 1200)
  }, [])

  const top = stack[stack.length - 1]

  return (
    <div className="app">
      <main className="screen">
        <div className="tab-content" key={tab}>
          {tab === 'agora' && <Agora onNewEntry={flagNewEntry} />}
          {tab === 'resumo' && (
            <Resumo
              newEntryId={newEntryId}
              onOpenClient={(clientId, p) => {
                setPeriod(p)
                push({ kind: 'client', clientId })
              }}
            />
          )}
          {tab === 'clientes' && (
            <Clientes onOpenClient={(clientId) => push({ kind: 'client', clientId })} />
          )}
          {tab === 'ajustes' && <Ajustes onAbout={() => push({ kind: 'about' })} />}
        </div>

        {top?.kind === 'client' && (
          <ClienteDetalhe
            clientId={top.clientId}
            period={period}
            onBack={pop}
            onPeriodChange={setPeriod}
            onOpenProject={(projectId) => push({ kind: 'project', projectId })}
            onReport={() => push({ kind: 'report', clientId: top.clientId })}
          />
        )}

        {top?.kind === 'project' && <ProjetoDetalhe projectId={top.projectId} onBack={pop} />}

        {top?.kind === 'report' && (
          <Relatorio
            clientId={top.clientId}
            period={period}
            onBack={pop}
            onPeriodChange={setPeriod}
          />
        )}

        {top?.kind === 'about' && (
          <Sobre onBack={pop} onLicenses={() => push({ kind: 'licenses' })} />
        )}

        {top?.kind === 'licenses' && <Licencas onBack={pop} />}
      </main>

      <TabBar
        active={tab}
        onChange={(next) => {
          setStack([])
          setTab(next)
        }}
      />

      <ToastLayer />
    </div>
  )
}
