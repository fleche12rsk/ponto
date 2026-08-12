import { useState } from 'react'
import { Sheet } from '../components/Sheet'
import { Button, Field, TextField } from '../components/ui'
import { CLIENT_COLORS, type Client } from '../lib/types'
import { addClient, updateClient } from '../store/store'

/**
 * Novo cliente / editar cliente (§4.2, §2.1).
 *
 * O cliente é só identidade: nome e cor. O valor por hora mora no projeto,
 * porque o mesmo cliente pode contratar serviços que valem preços diferentes.
 */
export function ClientSheet({
  client,
  onClose,
  onSaved,
}: {
  client?: Client
  onClose: () => void
  onSaved?: (client: Client) => void
}) {
  const editing = Boolean(client)

  const [name, setName] = useState(client?.name ?? '')
  const [color, setColor] = useState(client?.color ?? CLIENT_COLORS[0].hex)
  const [touched, setTouched] = useState(false)

  const nameError = touched && !name.trim() ? 'Dê um nome ao cliente.' : null

  function save() {
    setTouched(true)
    if (!name.trim()) return

    if (client) {
      updateClient(client.id, { name: name.trim(), color })
      onSaved?.({ ...client, name: name.trim(), color })
    } else {
      // Mesmo cuidado do ProjectSheet: `onSaved?.(addClient(...))` não
      // executaria o addClient quando onSaved fosse undefined.
      const created = addClient({ name: name.trim(), color })
      onSaved?.(created)
    }
    onClose()
  }

  return (
    <Sheet
      title={editing ? 'Editar cliente' : 'Novo cliente'}
      onClose={onClose}
      footer={
        <>
          <Button variant="text" onClick={onClose}>
            Cancelar
          </Button>
          <div className="grow" />
          <Button onClick={save}>Salvar</Button>
        </>
      }
    >
      <TextField
        label="Nome"
        value={name}
        placeholder="Ex.: Ateliê Rosa"
        autoCapitalize="words"
        error={nameError}
        onChange={(e) => setName(e.target.value)}
      />

      <Field label="Cor">
        <div className="color-grid" role="radiogroup" aria-label="Cor do cliente">
          {CLIENT_COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              role="radio"
              className="color-swatch"
              aria-checked={color === c.hex}
              aria-label={c.name}
              style={{ background: c.hex }}
              onClick={() => setColor(c.hex)}
            />
          ))}
        </div>
      </Field>
    </Sheet>
  )
}
