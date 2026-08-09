import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem, Encoding } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

/* ============================================================
   Compartilhar arquivos (§4.10)

   No Android: grava em Cache e abre a folha de compartilhamento nativa.
   No navegador (`npm run dev`): cai num download, para dar para testar o
   mesmo fluxo sem o celular.
   ============================================================ */

export async function sharePdf(
  base64: string,
  fileName: string,
  title: string,
): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    downloadFromBase64(base64, fileName, 'application/pdf')
    return
  }

  const written = await Filesystem.writeFile({
    path: fileName,
    data: base64,
    directory: Directory.Cache,
  })

  await Share.share({ title, files: [written.uri] })
}

export async function shareCsv(
  content: string,
  fileName: string,
  title: string,
): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    const base64 = btoa(unescape(encodeURIComponent(content)))
    downloadFromBase64(base64, fileName, 'text/csv;charset=utf-8')
    return
  }

  const written = await Filesystem.writeFile({
    path: fileName,
    data: content,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  })

  await Share.share({ title, files: [written.uri] })
}

function downloadFromBase64(base64: string, fileName: string, mime: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  // Revoga depois do clique para o navegador ter tempo de iniciar o download.
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}
