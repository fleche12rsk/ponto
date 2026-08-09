import { useEffect, useRef, useState, type ReactNode } from 'react'
import { pushBackHandler } from '../lib/backstack'

/* ============================================================
   Folha inferior (§6.8) e diálogo (§6.9)
   ============================================================ */

const OUT_MS = 180

interface SheetProps {
  title: string
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
  /** Pede confirmação antes de descartar arrastando/tocando fora. */
  confirmOnDismiss?: boolean
  onConfirmDismiss?: () => void
}

export function Sheet({
  title,
  children,
  footer,
  onClose,
  confirmOnDismiss,
  onConfirmDismiss,
}: SheetProps) {
  const [closing, setClosing] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const dragStartY = useRef<number | null>(null)
  const [dragY, setDragY] = useState(0)

  // A folha prende o foco e devolve ao elemento de origem ao fechar (§11).
  useEffect(() => {
    returnFocusRef.current = document.activeElement as HTMLElement | null
    const first = sheetRef.current?.querySelector<HTMLElement>(
      'input, textarea, button, [tabindex]:not([tabindex="-1"])',
    )
    // Só rouba o foco de fato se não for um campo de texto — abrir o teclado
    // sozinho atrapalha mais do que ajuda em folhas de escolha.
    if (first && first.tagName === 'BUTTON') first.focus({ preventScroll: true })
    return () => returnFocusRef.current?.focus?.({ preventScroll: true })
  }, [])

  function requestClose() {
    if (confirmOnDismiss && onConfirmDismiss) {
      onConfirmDismiss()
      return
    }
    setClosing(true)
    window.setTimeout(onClose, OUT_MS)
  }

  // O voltar do Android fecha a folha antes de sair do app.
  useEffect(() => pushBackHandler(requestClose))

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        requestClose()
      }
      if (e.key !== 'Tab' || !sheetRef.current) return
      const focusables = sheetRef.current.querySelectorAll<HTMLElement>(
        'input:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  /* Arrastar para baixo descarta. Só o cabeçalho é a alça, para não brigar
     com a rolagem do corpo da folha. */
  function onPointerDown(e: React.PointerEvent) {
    dragStartY.current = e.clientY
  }

  function onPointerMove(e: React.PointerEvent) {
    if (dragStartY.current === null) return
    setDragY(Math.max(0, e.clientY - dragStartY.current))
  }

  function onPointerUp() {
    if (dragStartY.current === null) return
    const travelled = dragY
    dragStartY.current = null
    setDragY(0)
    if (travelled > 96) requestClose()
  }

  return (
    <>
      <div
        className={`backdrop${closing ? ' is-closing' : ''}`}
        onClick={requestClose}
        aria-hidden="true"
      />
      <div
        ref={sheetRef}
        className={`sheet${closing ? ' is-closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={dragY ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined}
      >
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ touchAction: 'none' }}
        >
          <div className="sheet-grabber" aria-hidden="true" />
          <div className="sheet-header">
            <h2 className="t-h2 grow">{title}</h2>
          </div>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-footer">{footer}</div>}
      </div>
    </>
  )
}

/* ---------- Diálogo de confirmação ---------- */

interface DialogProps {
  title: string
  body: string
  confirmLabel: string
  cancelLabel: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function Dialog({
  title,
  body,
  confirmLabel,
  cancelLabel,
  destructive,
  onConfirm,
  onCancel,
}: DialogProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true })
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    const releaseBack = pushBackHandler(onCancel)
    return () => {
      document.removeEventListener('keydown', onKey)
      releaseBack()
    }
  }, [onCancel])

  return (
    <>
      <div className="backdrop" style={{ zIndex: 60 }} onClick={onCancel} aria-hidden="true" />
      <div ref={ref} className="dialog" role="alertdialog" aria-modal="true" aria-label={title}>
        <h2 className="t-body-strong">{title}</h2>
        <p className="t-body c-2" style={{ marginTop: 'var(--space-2)' }}>
          {body}
        </p>
        {/* O seguro à esquerda, o destrutivo à direita (§6.9). */}
        <div className="dialog-actions">
          <button type="button" className="btn btn-text" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={destructive ? 'btn btn-danger-solid' : 'btn btn-primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  )
}
