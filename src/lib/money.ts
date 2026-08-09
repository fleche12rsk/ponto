/* ============================================================
   Dinheiro: sempre em centavos inteiros (§9)
   ============================================================ */

/** `R$ 4.250,00` */
export function formatMoney(cents: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

/** `4.250,00`: sem símbolo, para tabelas onde a moeda já está no cabeçalho. */
export function formatMoneyPlain(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

/**
 * Lê o que a pessoa digitou num campo de dinheiro.
 * Aceita `120`, `120,50`, `1.200,50` e `1200.50`.
 */
export function parseMoneyToCents(input: string): number {
  const raw = input.trim().replace(/[^\d.,-]/g, '')
  if (!raw) return 0

  const lastComma = raw.lastIndexOf(',')
  const lastDot = raw.lastIndexOf('.')
  let normalized: string

  if (lastComma > lastDot) {
    // Vírgula é o separador decimal (padrão BR): tira os pontos de milhar.
    normalized = raw.replace(/\./g, '').replace(',', '.')
  } else if (lastDot > lastComma) {
    normalized = raw.replace(/,/g, '')
  } else {
    normalized = raw.replace(/[.,]/g, '')
  }

  const value = Number.parseFloat(normalized)
  if (!Number.isFinite(value)) return 0
  return Math.round(value * 100)
}

/**
 * Valor de um registro. Arredonda só no fim, para que a soma de vários
 * registros não acumule erro de centavo.
 */
export function entryValueCents(durationSeconds: number, rateCents: number): number {
  return Math.round((durationSeconds / 3600) * rateCents)
}
