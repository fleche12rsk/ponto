import { useState } from 'react'
import { Sheet } from '../components/Sheet'
import { Button, Field, TextField } from '../components/ui'
import { CLIENT_COLORS, type Client } from '../lib/types'
import { formatMoneyPlain, parseMoneyToCents } from '../lib/money'
import { addClient, updateClient } from '../store/store'
import { useDb } from '../store/useStore'

/**
 * Novo cliente / editar cliente (§4.2, §2.1).
 * Só o nome é obrigatório — tudo mais tem padrão sensato, para o onboarding
 * não virar um formulário de cadastro.
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
  const db = useDb()
  const editing = Boolean(client)

  const [name, setName] = useState(client?.name ?? '')
  const [color, setColor] = useState(client?.color ?? CLIENT_COLORS[0].hex)
  const [rate, setRate] = useState(() => {
    const cents = client?.default_rate_cents ?? db.settings.default_rate_cents
    return cents > 0 ? formatMoneyPlain(cents) : ''
  })
  const [touched, setTouched] = useState(false)

  const nameError = touched && !name.trim() ? 'Dê um nome ao cliente.' : null

  function save() {
    setTouched(true)
    if (!name.trim()) return

    const rateCents = rate.trim() ? parseMoneyToCents(rate) : db.settings.default_rate_cents

    if (client) {
      updateClient(client.id, { name: name.trim(), color, default_rate_cents: rateCents })
      onSaved?.({ ...client, name: name.trim(), color, default_rate_cents: rateCents })
    } else {
      const created = addClient({ name: name.trim(), color, default_rate_cents: rateCents })
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

      <TextField
        label="Valor por hora"
        value={rate}
        prefix="R$"
        inputMode="decimal"
        placeholder="0,00"
        hint="Vale para todos os projetos deste cliente, a não ser que o projeto tenha o seu."
        onChange={(e) => setRate(e.target.value)}
      />
    </Sheet>
  )
}
