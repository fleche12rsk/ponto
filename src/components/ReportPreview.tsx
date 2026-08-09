import type { ReportModel } from '../lib/report'

/**
 * Pré-visualização do relatório (§4.10) — espelho em HTML do layout do PDF
 * definido no §10. Sempre em papel branco e tipografia sóbria: quem lê é o
 * cliente do freelancer, não o usuário do app, então o tema escuro não entra
 * aqui nem quando o app está no escuro.
 */
export function ReportPreview({
  model,
  includeNotes,
}: {
  model: ReportModel
  includeNotes: boolean
}) {
  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={{ minWidth: 0 }}>
          <p style={S.name}>{model.freelancerName}</p>
          {model.freelancerContact && <p style={S.contact}>{model.freelancerContact}</p>}
        </div>
        <div style={{ textAlign: 'right', flex: 'none' }}>
          <p style={S.kicker}>RELATÓRIO DE HORAS</p>
          <p style={S.period}>{model.periodLabel}</p>
        </div>
      </header>

      <div style={S.rule} />

      <div style={S.clientRow}>
        <div>
          <p style={S.muted}>Cliente</p>
          <p style={S.clientName}>{model.clientName}</p>
        </div>
        {model.uniformRate && (
          <p style={{ ...S.muted, alignSelf: 'flex-end' }}>
            Valor por hora: {model.uniformRate}
          </p>
        )}
      </div>

      <p style={S.summary}>
        Total: {model.totalDuration} —{' '}
        <span style={S.summaryValue}>{model.totalValue}</span>
      </p>

      {model.groups.map((group) => (
        <section key={group.projectName} style={{ marginTop: 22 }}>
          <p style={S.groupName}>{group.projectName}</p>

          <table style={S.table}>
            <thead>
              <tr>
                <th style={{ ...S.th, width: '14%' }}>DATA</th>
                <th style={{ ...S.th, width: '20%' }}>INÍCIO–FIM</th>
                <th style={{ ...S.th, ...S.right, width: '14%' }}>DURAÇÃO</th>
                {includeNotes && <th style={{ ...S.th, width: '32%' }}>DESCRIÇÃO</th>}
                <th style={{ ...S.th, ...S.right, width: '20%' }}>VALOR</th>
              </tr>
            </thead>
            <tbody>
              {group.lines.map((line, i) => (
                <tr key={line.entryId} style={i % 2 === 1 ? S.zebra : undefined}>
                  <td style={{ ...S.td, ...S.mono }}>
                    {line.date}
                    {line.invoiced && <span style={S.invoiced}> (faturado)</span>}
                  </td>
                  <td style={{ ...S.td, ...S.mono }}>{line.timeRange}</td>
                  <td style={{ ...S.td, ...S.mono, ...S.right }}>{line.duration}</td>
                  {includeNotes && <td style={S.td}>{line.note}</td>}
                  <td style={{ ...S.td, ...S.mono, ...S.right }}>{line.value}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={S.subtotal} colSpan={includeNotes ? 4 : 3}>
                  Subtotal · {group.subtotalDuration}
                </td>
                <td style={{ ...S.subtotal, ...S.right }}>{group.subtotalValue}</td>
              </tr>
            </tfoot>
          </table>
        </section>
      ))}

      {model.isEmpty && (
        <p style={{ ...S.muted, marginTop: 24 }}>Nenhuma hora registrada neste período.</p>
      )}

      <div style={S.totalBlock}>
        <div style={S.amberRule} />
        <div style={S.totalRow}>
          <span style={S.muted}>Total de horas</span>
          <span style={S.totalHours}>{model.totalDuration}</span>
        </div>
        <div style={S.totalRow}>
          <span style={S.totalLabel}>Total a cobrar</span>
          <span style={S.totalValue}>{model.totalValue}</span>
        </div>
      </div>

      <footer style={S.footer}>
        <span>Gerado por Horas · {model.generatedAt}</span>
        <span>Página 1</span>
      </footer>
    </div>
  )
}

/* O PDF é branco e neutro por definição, então estes valores são fixos e não
   usam os tokens de tema do app. */
const INK = '#1A1813'
const MUTED = '#7C7768'
const RULE = '#E8E4DA'
const AMBER = '#F5A100'
const SERIF = 'Source Serif 4, Georgia, serif'
const SANS = 'Public Sans, system-ui, sans-serif'
const MONO = 'IBM Plex Mono, ui-monospace, monospace'

const S: Record<string, React.CSSProperties> = {
  page: {
    background: '#fff',
    color: INK,
    fontFamily: SANS,
    fontSize: 12,
    lineHeight: 1.45,
    padding: '28px 24px 32px',
    margin: '16px',
    borderRadius: 4,
    boxShadow: '0 2px 12px rgba(20,18,14,.15)',
  },
  header: { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' },
  name: { fontFamily: SERIF, fontSize: 20, fontWeight: 600 },
  contact: { fontSize: 11, color: MUTED, marginTop: 2 },
  kicker: { fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: MUTED },
  period: { fontSize: 11, marginTop: 2 },
  rule: { height: 1, background: RULE, margin: '12px 0 18px' },
  clientRow: { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-end' },
  muted: { fontSize: 11, color: MUTED },
  clientName: { fontSize: 14, fontWeight: 700, marginTop: 2 },
  summary: { fontFamily: SERIF, fontSize: 22, fontWeight: 600, marginTop: 18 },
  summaryValue: { borderBottom: `2px solid ${AMBER}`, paddingBottom: 1 },
  groupName: { fontSize: 12, fontWeight: 700, marginBottom: 6 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.06em',
    color: MUTED,
    textAlign: 'left',
    padding: '0 4px 4px',
    borderBottom: `1px solid ${RULE}`,
  },
  td: { fontSize: 11, padding: '5px 4px', verticalAlign: 'top' },
  mono: { fontFamily: MONO, fontVariantNumeric: 'tabular-nums' },
  right: { textAlign: 'right' },
  zebra: { background: 'rgba(20,18,14,.04)' },
  invoiced: { color: MUTED, fontSize: 9 },
  subtotal: {
    fontSize: 11,
    fontWeight: 700,
    padding: '6px 4px 0',
    borderTop: `1px solid ${RULE}`,
    textAlign: 'right',
  },
  totalBlock: { marginTop: 28, marginLeft: 'auto', width: '70%' },
  amberRule: { height: 2, background: AMBER, marginBottom: 8 },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 },
  totalHours: { fontFamily: MONO, fontSize: 12 },
  totalLabel: { fontFamily: SERIF, fontSize: 16, fontWeight: 700, marginTop: 6 },
  totalValue: { fontFamily: SERIF, fontSize: 16, fontWeight: 700, marginTop: 6 },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 32,
    paddingTop: 10,
    borderTop: `1px solid ${RULE}`,
    fontSize: 9,
    color: MUTED,
  },
}
