import { Capacitor, registerPlugin } from '@capacitor/core'
import { flushWrites } from './db'

/**
 * Avisa o widget da tela inicial que o estado mudou.
 *
 * O widget lê o mesmo armazenamento do app por conta própria — esta ponte
 * não manda dados, só um empurrão para ele se redesenhar. Sem isso o Android
 * só o atualizaria de meia em meia hora.
 */

interface PontoWidgetPlugin {
  refresh(): Promise<void>
}

const PontoWidget = registerPlugin<PontoWidgetPlugin>('PontoWidget')

export async function refreshWidget(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  /*
    Espera a gravação terminar antes de avisar. O widget lê do disco, então
    avisar antes do save concluir faria ele desenhar o estado anterior — e o
    erro só apareceria de vez em quando, que é o pior tipo.
  */
  await flushWrites()

  try {
    await PontoWidget.refresh()
  } catch {
    // Widget é conveniência. Aparelho sem widget na tela inicial, versão
    // antiga do app, plugin ausente: nada disso pode quebrar o cronômetro.
  }
}
