import { useRef, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Button, MoneyField, PhoneField, Segmented, Switch, TextField } from '../components/ui'
import { Dialog } from '../components/Sheet'
import { toast } from '../components/Toast'
import { useDb } from '../store/useStore'
import { eraseEverything, replaceAll, updateSettings } from '../store/store'
import { exportJson, parseBackup } from '../lib/db'
import { shareCsv } from '../lib/share'
import type { Database, ThemePref, WeekStart } from '../lib/types'

/** Ajustes (§4.11). */
export function Ajustes({ onAbout }: { onAbout: () => void }) {
  const db = useDb()
  const s = db.settings

  const [name, setName] = useState(s.freelancer_name)
  const [email, setEmail] = useState(s.freelancer_email)
  const [confirmErase, setConfirmErase] = useState(false)
  const [pendente, setPendente] = useState<Database | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function exportEverything() {
    try {
      await shareCsv(exportJson(db), 'ponto-backup.json', 'Backup do Ponto')
      toast('Backup exportado')
    } catch {
      toast('Não deu para exportar')
    }
  }

  /*
    O seletor de arquivo nativo do Android funciona dentro do WebView, então
    importar não precisa de plugin nenhum: o <input type="file"> abre a mesma
    tela de "Ficheiros" de qualquer outro app.
  */
  async function escolherArquivo(file: File | undefined) {
    if (!file) return
    try {
      setPendente(parseBackup(await file.text()))
    } catch (erro) {
      toast(erro instanceof Error ? erro.message : 'Não deu para ler o arquivo')
    } finally {
      // Zera para dar para escolher o mesmo arquivo duas vezes seguidas.
      if (fileRef.current) fileRef.current.value = ''
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

          <MoneyField
            label="Valor por hora padrão"
            cents={s.default_rate_cents}
            hint="Preenche o campo de valor ao criar um projeto novo."
            onChangeCents={(cents) => updateSettings({ default_rate_cents: cents })}
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
            placeholder="Como você assina seus relatórios"
            autoCapitalize="words"
            onChange={(e) => setName(e.target.value)}
            onBlur={() => updateSettings({ freelancer_name: name.trim() })}
          />
          <TextField
            label="E-mail"
            value={email}
            placeholder="voce@exemplo.com"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => updateSettings({ freelancer_email: email.trim() })}
          />

          <PhoneField
            label="Telefone"
            digits={s.freelancer_phone}
            onChangeDigits={(d) => updateSettings({ freelancer_phone: d })}
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
          <p className="t-caption c-3" style={{ marginBottom: 'var(--space-3)' }}>
            O backup é um arquivo com tudo: clientes, projetos, registros e ajustes.
            Guarde numa nuvem se trocar de celular.
          </p>

          <Button variant="secondary" block onClick={exportEverything}>
            Exportar tudo
          </Button>

          <div style={{ marginTop: 'var(--space-3)' }}>
            <Button variant="secondary" block onClick={() => fileRef.current?.click()}>
              Importar backup
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              style={{ display: 'none' }}
              aria-hidden="true"
              tabIndex={-1}
              onChange={(e) => void escolherArquivo(e.target.files?.[0])}
            />
          </div>

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

      {pendente && (
        <Dialog
          title="Substituir tudo pelo backup?"
          body={`O backup tem ${pendente.clients.length} ${pendente.clients.length === 1 ? 'cliente' : 'clientes'} e ${pendente.entries.length} ${pendente.entries.length === 1 ? 'registro' : 'registros'}. O que está no app agora será apagado.`}
          cancelLabel="Cancelar"
          confirmLabel="Substituir"
          destructive
          onCancel={() => setPendente(null)}
          onConfirm={() => {
            replaceAll(pendente)
            setPendente(null)
            toast('Backup importado')
          }}
        />
      )}

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
