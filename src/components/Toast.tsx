import { useEffect, useState } from 'react'

/* ============================================================
   Toast — confirmação efêmera, 2.5s visíveis (§6.10)
   ============================================================ */

type ToastListener = (message: string) => void

let listener: ToastListener | null = null

/** `toast('Registro salvo')` — textos exatos em §8. */
export function toast(message: string) {
  listener?.(message)
}

export function ToastLayer() {
  const [message, setMessage] = useState<string | null>(null)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    listener = (msg) => {
      setClosing(false)
      setMessage(msg)
    }
    return () => {
      listener = null
    }
  }, [])

  useEffect(() => {
    if (!message) return
    const hide = window.setTimeout(() => setClosing(true), 2500)
    const remove = window.setTimeout(() => setMessage(null), 2700)
    return () => {
      window.clearTimeout(hide)
      window.clearTimeout(remove)
    }
  }, [message])

  if (!message) return null

  return (
    <div className="toast-layer">
      {/* polite: confirma sem interromper o que o leitor de tela está lendo. */}
      <div className={`toast t-label${closing ? ' is-closing' : ''}`} role="status" aria-live="polite">
        {message}
      </div>
    </div>
  )
}
