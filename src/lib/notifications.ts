import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import type { Database } from './types'
import { formatTime } from './time'

/* ============================================================
   Notificações (§8)
   - persistente enquanto o cronômetro roda;
   - aviso de timer longo ("esqueceu de parar?");
   - lembrete de fim de dia.

   Não existe serviço nativo em primeiro plano no v1: o tempo é calculado a
   partir de `started_at`, então a contagem nunca depende de um processo vivo.
   A notificação persistente é informativa e, por isso, mostra o horário de
   início em vez de um relógio que ficaria congelado.
   ============================================================ */

const ID_RUNNING = 1001
const ID_LONG_TIMER = 1002
const ID_END_OF_DAY = 1003

const isNative = () => Capacitor.isNativePlatform()

let permissionAsked = false

export async function ensurePermission(): Promise<boolean> {
  if (!isNative()) return false
  try {
    const status = await LocalNotifications.checkPermissions()
    if (status.display === 'granted') return true
    if (permissionAsked) return false
    permissionAsked = true
    const asked = await LocalNotifications.requestPermissions()
    return asked.display === 'granted'
  } catch {
    return false
  }
}

async function cancel(...ids: number[]) {
  if (!isNative()) return
  try {
    await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) })
  } catch {
    /* Cancelar o que não existe não é erro que valha interromper o app. */
  }
}

/**
 * Reflete o estado atual do cronômetro nas notificações.
 * Chamado sempre que o timer inicia, pausa, retoma ou encerra.
 */
export async function syncTimerNotifications(db: Database): Promise<void> {
  if (!isNative()) return
  const granted = await ensurePermission()
  if (!granted) return

  await cancel(ID_RUNNING, ID_LONG_TIMER)

  const running = db.running
  if (!running || running.state !== 'running') return

  const project = db.projects.find((p) => p.id === running.project_id)
  const projectName = project?.name ?? 'Projeto'

  const startedAtMs =
    new Date(running.started_at).getTime() - running.accumulated_seconds * 1000
  const longAt = new Date(startedAtMs + db.settings.notif_long_timer_hours * 3600 * 1000)

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: ID_RUNNING,
          title: 'Contando',
          body: `${projectName} · desde ${formatTime(new Date(startedAtMs).toISOString())}`,
          ongoing: true,
          autoCancel: false,
          smallIcon: 'ic_stat_ponto',
          iconColor: '#FFB020',
          schedule: { at: new Date(Date.now() + 500) },
        },
      ],
    })

    if (longAt.getTime() > Date.now()) {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: ID_LONG_TIMER,
            title: 'Ainda contando',
            body: `Você está há ${db.settings.notif_long_timer_hours}h em ${projectName}. Esqueceu de parar?`,
            smallIcon: 'ic_stat_ponto',
            iconColor: '#FFB020',
            schedule: { at: longAt },
          },
        ],
      })
    }
  } catch {
    /* Notificação é conveniência: se falhar, o app continua funcionando. */
  }
}

export async function clearTimerNotifications(): Promise<void> {
  await cancel(ID_RUNNING, ID_LONG_TIMER)
}

/** Lembrete diário às 20h, se nenhuma hora foi registrada (§8). */
export async function syncEndOfDayReminder(db: Database): Promise<void> {
  if (!isNative()) return
  await cancel(ID_END_OF_DAY)
  if (!db.settings.notif_end_of_day) return

  const granted = await ensurePermission()
  if (!granted) return

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: ID_END_OF_DAY,
          title: 'Nenhuma hora hoje',
          body: 'Registrou algum trabalho de hoje?',
          smallIcon: 'ic_stat_ponto',
          iconColor: '#FFB020',
          schedule: { on: { hour: 20, minute: 0 }, allowWhileIdle: true },
        },
      ],
    })
  } catch {
    /* idem */
  }
}
