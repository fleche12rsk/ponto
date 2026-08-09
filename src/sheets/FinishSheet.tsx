import { useState } from 'react'
import { Dialog, Sheet } from '../components/Sheet'
import { Button, Dot, TextArea } from '../components/ui'
import { formatDuration } from '../lib/time'
import { projectLabel } from '../lib/calc'
import { useDb } from '../store/useStore'

/**
 * Finalizar registro (§4.3).
 * Hierarquia: duração já calculada → projeto → nota → ações.
 */
export function FinishSheet({
  seconds,
  projectId,
  onSave,
  onDiscard,
  onClose,
}: {
  seconds: number
  projectId: string
  onSave: (note: string) => void
  onDiscard: () => void
  onClose: () => void
}) {
  const db = useDb()
  const label = projectLabel(db, projectId)
  const [note, setNote] = useState('')
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  return (
    <>
      <Sheet
        title="Finalizar registro"
        onClose={onClose}
        footer={
          <>
            <Button variant="text" onClick={() => setConfirmDiscard(true)}>
              Descartar
            </Button>
            <div className="grow" />
            <Button onClick={() => onSave(note)}>Salvar registro</Button>
          </>
        }
      >
        <p className="t-display" style={{ marginBottom: 'var(--space-2)' }}>
          {formatDuration(seconds)}
        </p>

        <div className="row" style={{ marginBottom: 'var(--space-5)' }}>
          <Dot color={label.color} />
          <span className="t-body c-2 truncate">
            {label.name} · {label.clientName}
          </span>
        </div>

        <TextArea
          label="Nota"
          value={note}
          placeholder="O que você fez? (opcional)"
          autoCapitalize="sentences"
          onChange={(e) => setNote(e.target.value)}
        />
      </Sheet>

      {confirmDiscard && (
        <Dialog
          title="Descartar o tempo cronometrado?"
          body="O tempo desta sessão será perdido."
          cancelLabel="Voltar"
          confirmLabel="Descartar"
          destructive
          onCancel={() => setConfirmDiscard(false)}
          onConfirm={() => {
            setConfirmDiscard(false)
            onDiscard()
          }}
        />
      )}
    </>
  )
}
