/**
 * Telefone brasileiro. O dado guardado são só os dígitos; parênteses e
 * traço são aparência, e por isso moram aqui e não no banco.
 */
export function formatPhoneBR(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  // Fixo tem 8 dígitos depois do DDD; celular tem 9.
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function onlyDigits(value: string, max = 11): string {
  return value.replace(/\D/g, '').slice(0, max)
}
