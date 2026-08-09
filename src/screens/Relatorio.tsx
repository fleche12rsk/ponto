import { useMemo, useState } from 'react'
import { ArrowLeft, FileSpreadsheet, Share2 } from 'lucide-react'
import { Button, Segmented, Switch } from '../components/ui'
import { Dialog } from '../components/Sheet'
import { PeriodSheet } from '../sheets/PeriodSheet'
import { ReportPreview } from '../components/ReportPreview'
import { toast } from '../components/Toast'
import { useDb } from '../store/useStore'
import { setInvoiced } from '../store/store'
import { buildCsv, buildReport } from '../lib/report'
import { generateReportPdf, pdfFileName, pdfToBase64 } from '../lib/pdf'
import { sharePdf, shareCsv } from '../lib/share'
import { periodLabel, type Period } from '../lib/time'
import type { Scope } from '../lib/calc'

type Step = 'config' | 'preview'

/**
 * Configurar e pré-visualizar o relatório (§4.10).
 *
 * A pré-visualização é uma renderização em HTML do MESMO modelo que alimenta
 * o PDF — o WebView do Android não abre PDF em iframe, e um preview fiel em
 * HTML é melhor do que embutir um leitor de PDF inteiro no app.
 */
export function Relatorio({
  clientId,
  period,
  onBack,
  onPeriodChange,
}: {
  clientId: string
  period: Period
  onBack: () => void
  onPeriodChange: (p: Period) => void
}) {
  const db = useDb()
  const client = db.clients.find((c) => c.id === clientId)

  const [step, setStep] = useState<Step>('config')
  const [includeNotes, setIncludeNotes] = useState(true)
  const [scope, setScope] = useState<Scope>('unbilled')
  const [pickingPeriod, setPickingPeriod] = useState(false)
  const [sharing, setSharing] = useState<'pdf' | 'csv' | null>(null)
  const [askInvoice, setAskInvoice] = useState(false)

  const model = useMemo(
    () => buildReport(db, { clientId, period, includeNotes, scope }),
    [db, clientId, period, includeNotes, scope],
  )

  async function handleSharePdf() {
    if (model.isEmpty) return
    setSharing('pdf')
    try {
      const doc = generateReportPdf(model, includeNotes)
      await sharePdf(
        pdfToBase64(doc),
        pdfFileName(model.clientName, model.periodLabel),
        `Relatório de horas — ${model.clientName}`,
      )
      toast('PDF gerado')
      if (scope !== 'invoiced') setAskInvoice(true)
    } catch {
      toast('Não deu para gerar o PDF')
    } finally {
      setSharing(null)
    }
  }

  async function handleShareCsv() {
    if (model.isEmpty) return
    setSharing('csv')
    try {
      const csv = buildCsv(db, { clientId, period, includeNotes, scope })
      await shareCsv(
        csv,
        pdfFileName(model.clientName, model.periodLabel).replace(/\.pdf$/, '.csv'),
        `Ponto — ${model.clientName}`,
      )
      toast('CSV exportado')
    } catch {
      toast('Não deu para exportar o CSV')
    } finally {
      setSharing(null)
    }
  }

  return (
    <section className="stack-screen">
      <header className="screen-header">
        <button
          type="button"
          className="icon-btn"
          aria-label="Voltar"
          onClick={() => (step === 'preview' ? setStep('config') : onBack())}
        >
          <ArrowLeft size={24} aria-hidden="true" />
        </button>
        <h1 className="t-h1 grow truncate">
          {step === 'config' ? 'Configurar relatório' : 'Pré-visualizar'}
        </h1>
      </header>

      {step === 'config' && (
        <>
          <div className="screen-body">
            <p className="t-body c-2" style={{ marginBottom: 'var(--space-5)' }}>
              {client?.name ?? '—'}
            </p>

            <div className="section" style={{ marginTop: 0 }}>
              <h2 className="t-h2 c-3 section-title">Período</h2>
              <Button variant="secondary" block onClick={() => setPickingPeriod(true)}>
                {periodLabel(period)}
              </Button>
            </div>

            <div className="section">
              <h2 className="t-h2 c-3 section-title">Escopo</h2>
              <Segmented<Scope>
                label="Escopo do relatório"
                value={scope}
                onChange={setScope}
                options={[
                  { value: 'unbilled', label: 'A cobrar' },
                  { value: 'all', label: 'Tudo' },
                  { value: 'invoiced', label: 'Faturado' },
                ]}
              />
            </div>

            <div className="section">
              <div className="setting-row">
                <span className="col grow">
                  <span className="t-body">Incluir as notas</span>
                  <span className="t-caption c-3">
                    A coluna "Descrição" mostra o que você escreveu em cada registro.
                  </span>
                </span>
                <Switch
                  checked={includeNotes}
                  onChange={setIncludeNotes}
                  label="Incluir as notas no relatório"
                />
              </div>
            </div>

            <div className="section">
              <p className="t-caption c-3">
                {model.isEmpty
                  ? 'Nenhuma hora neste período com esse escopo.'
                  : `${model.entryIds.length} ${model.entryIds.length === 1 ? 'registro' : 'registros'} · ${model.totalDuration} · ${model.totalValue}`}
              </p>
            </div>
          </div>

          <div style={{ padding: 'var(--space-4)', paddingBottom: 'calc(var(--space-4) + env(safe-area-inset-bottom, 0px))' }}>
            <Button size="lg" block disabled={model.isEmpty} onClick={() => setStep('preview')}>
              Pré-visualizar
            </Button>
          </div>
        </>
      )}

      {step === 'preview' && (
        <>
          <div className="screen-body" style={{ padding: 0, background: '#f0eee9' }}>
            <ReportPreview model={model} includeNotes={includeNotes} />
          </div>

          <div
            className="row"
            style={{
              padding: 'var(--space-4)',
              paddingBottom: 'calc(var(--space-4) + env(safe-area-inset-bottom, 0px))',
              borderTop: '1px solid var(--line)',
              gap: 'var(--space-3)',
            }}
          >
            <Button
              variant="secondary"
              loading={sharing === 'csv'}
              onClick={handleShareCsv}
            >
              <FileSpreadsheet size={18} aria-hidden="true" /> CSV
            </Button>
            <div className="grow">
              <Button block loading={sharing === 'pdf'} onClick={handleSharePdf}>
                <Share2 size={18} aria-hidden="true" /> Compartilhar PDF
              </Button>
            </div>
          </div>
        </>
      )}

      {pickingPeriod && (
        <PeriodSheet
          period={period}
          onChange={onPeriodChange}
          onClose={() => setPickingPeriod(false)}
        />
      )}

      {/* Evita cobrar as mesmas horas de novo no mês seguinte (§2.4). */}
      {askInvoice && (
        <Dialog
          title="Marcar essas horas como faturadas?"
          body="Elas saem do total a cobrar, mas continuam no histórico."
          cancelLabel="Agora não"
          confirmLabel="Marcar faturado"
          onCancel={() => setAskInvoice(false)}
          onConfirm={() => {
            setInvoiced(model.entryIds, true)
            setAskInvoice(false)
            toast('Marcado como faturado')
          }}
        />
      )}
    </section>
  )
}
