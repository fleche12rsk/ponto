import { useState } from 'react'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { Badge } from '../components/ui'
import { THIRD_PARTY_LICENSES } from '../lib/licenses.generated'

/**
 * Licenças de código aberto.
 *
 * As bibliotecas MIT/ISC e as três fontes OFL-1.1 vão compiladas dentro do
 * APK, e essas licenças pedem que o aviso de copyright e o texto viajem
 * junto com o software. Esta tela é onde eles viajam.
 *
 * O conteúdo vem de licenses.generated.ts, produzido a partir dos arquivos
 * LICENSE reais (veja scripts/gerar-licencas.mjs).
 */
export function Licencas({ onBack }: { onBack: () => void }) {
  const [aberta, setAberta] = useState<string | null>(null)

  return (
    <section className="stack-screen">
      <header className="screen-header">
        <button type="button" className="icon-btn" aria-label="Voltar" onClick={onBack}>
          <ArrowLeft size={24} aria-hidden="true" />
        </button>
        <h1 className="t-h1 grow">Licenças</h1>
      </header>

      <div className="screen-body">
        <p className="t-body c-2" style={{ marginBottom: 'var(--space-5)' }}>
          O Ponto usa estes projetos de código aberto. Toque em cada um para ler a licença completa.
        </p>

        {THIRD_PARTY_LICENSES.map((item) => {
          const expandida = aberta === item.pkg
          return (
            <article key={item.pkg} style={{ borderBottom: '1px solid var(--line)' }}>
              <button
                type="button"
                className="setting-row"
                aria-expanded={expandida}
                onClick={() => setAberta(expandida ? null : item.pkg)}
              >
                <span className="col grow" style={{ minWidth: 0, gap: 2 }}>
                  <span className="row" style={{ gap: 'var(--space-2)' }}>
                    <span className="t-body-strong truncate">{item.name}</span>
                    <Badge>{item.license}</Badge>
                  </span>
                  <span className="t-caption c-3 truncate">{item.note}</span>
                </span>
                <ChevronDown
                  size={20}
                  className="c-3"
                  aria-hidden="true"
                  style={{
                    flex: 'none',
                    transform: expandida ? 'rotate(180deg)' : 'none',
                    transition: 'transform var(--dur-tab) var(--ease-standard)',
                  }}
                />
              </button>

              {expandida && (
                <div style={{ paddingBottom: 'var(--space-4)' }}>
                  {item.copyright && (
                    <p className="t-caption c-2" style={{ marginBottom: 'var(--space-3)' }}>
                      {item.copyright}
                    </p>
                  )}
                  {/*
                    O texto vem com as quebras de linha originais da licença;
                    rolagem horizontal própria para o corpo da tela nunca
                    rolar de lado.
                  */}
                  <pre
                    className="license-text"
                    aria-label={`Texto da licença ${item.license} de ${item.name}`}
                  >
                    {item.text}
                  </pre>
                </div>
              )}
            </article>
          )
        })}

        <p className="t-caption c-3" style={{ marginTop: 'var(--space-6)' }}>
          O próprio Ponto é distribuído sob a licença MIT.
        </p>
      </div>
    </section>
  )
}
