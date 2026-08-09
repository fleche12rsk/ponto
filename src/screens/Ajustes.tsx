import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Button, Segmented, Switch, TextField } from '../components/ui'
import { Dialog } from '../components/Sheet'
import { toast } from '../components/Toast'
import { useDb } from '../store/useStore'
import { eraseEverything, updateSettings } from '../store/store'
import { exportJson } from '../lib/db'
import { shareCsv } from '../lib/share'
import { formatMoneyPlain, parseMoneyToCents } from '../lib/money'
import type { ThemePref, WeekStart } from '../lib/types'

/** Ajustes (§4.11). */
export function Ajustes({ onAbout }: { onAbout: () => void }) {
  const db = useDb()
  const s = db.settings

  const [rate, setRate] = useState(
    s.default_rate_cents > 0 ? formatMoneyPlain(s.default_rate_cents) : '',
  )
  const [name, setName] = useState(s.freelancer_name)
  const [contact, setContact] = useState(s.freelancer_contact)
  const [confirmErase, setConfirmErase] = useState(false)

  async function exportEverything() {
    try {
      await shareCsv(exportJson(db), 'horas-backup.json', 'Backup do Horas')
      toast('Backup exportado')
    } catch {
      toast('Não deu para exportar')
    }
  }

  return (
    <section className="screen">
      <header className="screen-header">
        <h1 className="t-h1 grow">Ajustes</h1>
      </header>

      <div className="screen-body">
        <div className="section" style={{ marginTop: 0 }}>
          <h2 className="t-h2 c-3 section-title">Padrões</h2>

          <TextField
            label="Valor por hora padrão"
            value={rate}
            prefix="R$"
            inputMode="decimal"
            placeholder="0,00"
            hint="Usado ao criar um cliente novo."
            onChange={(e) => setRate(e.target.value)}
            onBlur={() => updateSettings({ default_rate_cents: parseMoneyToCents(rate) })}
          />

          <div style={{ marginTop: 'var(--space-4)' }}>
            <span className="field-label t-label" style={{ display: 'block', marginBottom: 'var(--space-2)' }}>
              A semana começa em
            </span>
            <Segmented<WeekStart>
              label="Primeiro dia da semana"
              value={s.week_start}
              onChange={(v) => updateSettings({ week_start: v })}
              options={[
                { value: 'monday', label: 'Segunda' },
                { value: 'sunday', label: 'Domingo' },
              ]}
            />
          </div>
        </div>

        <div className="section">
          <h2 className="t-h2 c-3 section-title">Aparência</h2>
          <Segmented<ThemePref>
            label="Tema"
            value={s.theme}
            onChange={(v) => updateSettings({ theme: v })}
            options={[
              { value: 'system', label: 'Sistema' },
              { value: 'dark', label: 'Escuro' },
              { value: 'light', label: 'Claro' },
            ]}
          />
        </div>

        <div className="section">
          <h2 className="t-h2 c-3 section-title">Relatório</h2>
          <p className="t-caption c-3" style={{ marginBottom: 'var(--space-3)' }}>
            Aparece no cabeçalho do PDF que você manda para o cliente.
          </p>
          <TextField
            label="Seu nome"
            value={name}
            placeholder="Ex.: Mauricio Sardá"
            autoCapitalize="words"
            onChange={(e) => setName(e.target.value)}
            onBlur={() => updateSettings({ freelancer_name: name.trim() })}
          />
          <TextField
            label="Contato"
            value={contact}
            placeholder="E-mail ou telefone"
            inputMode="email"
            onChange={(e) => setContact(e.target.value)}
            onBlur={() => updateSettings({ freelancer_contact: contact.trim() })}
          />
        </div>

        <div className="section">
          <h2 className="t-h2 c-3 section-title">Notificações</h2>

          <div className="setting-row">
            <span className="col grow">
              <span className="t-body">Avisar se o timer ficar muito tempo ligado</span>
              <span className="t-caption c-3">Depois de {s.notif_long_timer_hours}h contando.</span>
            </span>
          </div>

          <div style={{ padding: 'var(--space-2) 0 var(--space-4)' }}>
            <Segmented<string>
              label="Horas até o aviso"
              value={String(s.notif_long_timer_hours)}
              onChange={(v) => updateSettings({ notif_long_timer_hours: Number(v) })}
              options={[
                { value: '4', label: '4h' },
                { value: '6', label: '6h' },
                { value: '8', label: '8h' },
                { value: '12', label: '12h' },
              ]}
            />
          </div>

          <div className="setting-row">
            <span className="col grow">
              <span className="t-body">Lembrete no fim do dia</span>
              <span className="t-caption c-3">Às 20h, se você não registrou nada.</span>
            </span>
            <Switch
              checked={s.notif_end_of_day}
              onChange={(v) => updateSettings({ notif_end_of_day: v })}
              label="Lembrete no fim do dia"
            />
          </div>
        </div>

        <div className="section">
          <h2 className="t-h2 c-3 section-title">Dados</h2>
          <Button variant="secondary" block onClick={exportEverything}>
            Exportar tudo
          </Button>
          <div style={{ marginTop: 'var(--space-3)' }}>
            <Button variant="danger" block onClick={() => setConfirmErase(true)}>
              Apagar tudo
            </Button>
          </div>
        </div>

        <div className="section">
          <button type="button" className="setting-row" onClick={onAbout}>
            <span className="t-body grow">Sobre</span>
            <ChevronRight size={20} className="c-3" aria-hidden="true" />
          </button>
        </div>
      </div>

      {confirmErase && (
        <Dialog
          title="Apagar tudo?"
          body="Clientes, projetos e registros serão apagados deste celular. Não dá para desfazer."
          cancelLabel="Cancelar"
          confirmLabel="Apagar tudo"
          destructive
          onCancel={() => setConfirmErase(false)}
          onConfirm={() => {
            void eraseEverything()
            setConfirmErase(false)
            toast('Tudo apagado')
          }}
        />
      )}
    </section>
  )
}
