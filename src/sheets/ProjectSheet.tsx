import { useState } from 'react'
import { Sheet } from '../components/Sheet'
import { Button, TextField } from '../components/ui'
import type { Project } from '../lib/types'
import { formatMoneyPlain, parseMoneyToCents } from '../lib/money'
import { formatDuration, parseHoursToSeconds } from '../lib/time'
import { addProject, updateProject } from '../store/store'
import { useDb } from '../store/useStore'

/**
 * Novo projeto / editar projeto (§4.2).
 * Valor/hora vazio herda o do cliente; orçamento vazio significa sem orçamento.
 */
export function ProjectSheet({
  clientId,
  project,
  title,
  onClose,
  onSaved,
}: {
  clientId: string
  project?: Project
  title?: string
  onClose: () => void
  onSaved?: (project: Project) => void
}) {
  const db = useDb()
  const client = db.clients.find((c) => c.id === clientId)

  const [name, setName] = useState(project?.name ?? '')
  const [rate, setRate] = useState(
    project?.rate_cents != null ? formatMoneyPlain(project.rate_cents) : '',
  )
  const [budget, setBudget] = useState(
    project?.budget_seconds ? formatDuration(project.budget_seconds, { short: true }) : '',
  )
  const [touched, setTouched] = useState(false)

  const nameError = touched && !name.trim() ? 'Dê um nome ao projeto.' : null
  const budgetSeconds = budget.trim() ? parseHoursToSeconds(budget) : null
  const budgetError =
    touched && budget.trim() && budgetSeconds === null
      ? 'Não entendi. Tente "15h" ou "15h30".'
      : null

  function save() {
    setTouched(true)
    if (!name.trim()) return
    if (budget.trim() && budgetSeconds === null) return

    const rateCents = rate.trim() ? parseMoneyToCents(rate) : null

    if (project) {
      updateProject(project.id, {
        name: name.trim(),
        rate_cents: rateCents,
        budget_seconds: budgetSeconds,
      })
      onSaved?.({ ...project, name: name.trim(), rate_cents: rateCents, budget_seconds: budgetSeconds })
    } else {
      const created = addProject({
        client_id: clientId,
        name: name.trim(),
        rate_cents: rateCents,
        budget_seconds: budgetSeconds,
      })
      onSaved?.(created)
    }
    onClose()
  }

  const inheritedRate = client ? formatMoneyPlain(client.default_rate_cents) : '0,00'

  return (
    <Sheet
      title={title ?? (project ? 'Editar projeto' : 'Novo projeto')}
      onClose={onClose}
      footer={
        <>
          <Button variant="text" onClick={onClose}>
            {project ? 'Cancelar' : 'Agora não'}
          </Button>
          <div className="grow" />
          <Button onClick={save}>Salvar</Button>
        </>
      }
    >
      <TextField
        label="Nome do projeto"
        value={name}
        placeholder="Ex.: Site institucional"
        autoCapitalize="sentences"
        error={nameError}
        onChange={(e) => setName(e.target.value)}
      />

      <TextField
        label="Valor por hora"
        value={rate}
        prefix="R$"
        inputMode="decimal"
        placeholder={inheritedRate}
        hint={`Vazio usa o valor do cliente: R$ ${inheritedRate}.`}
        onChange={(e) => setRate(e.target.value)}
      />

      <TextField
        label="Horas orçadas"
        value={budget}
        placeholder="Ex.: 15h"
        error={budgetError}
        hint={
          budgetSeconds
            ? `Equivale a ${formatDuration(budgetSeconds)}.`
            : 'Opcional. Serve para avisar quando o projeto passar do combinado.'
        }
        onChange={(e) => setBudget(e.target.value)}
      />
    </Sheet>
  )
}
