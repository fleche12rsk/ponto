import type { ReactNode, TextareaHTMLAttributes, InputHTMLAttributes } from 'react'
import { ChevronRight } from 'lucide-react'
import { formatMoneyPlain } from '../lib/money'
import { formatPhoneBR, onlyDigits } from '../lib/phone'

/* ============================================================
   Primitivas de interface: §6
   ============================================================ */

type ButtonVariant = 'primary' | 'secondary' | 'text' | 'danger' | 'danger-solid'

interface ButtonProps {
  children: ReactNode
  variant?: ButtonVariant
  size?: 'md' | 'lg'
  block?: boolean
  disabled?: boolean
  loading?: boolean
  pulsing?: boolean
  onClick?: () => void
  ariaLabel?: string
  type?: 'button' | 'submit'
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  block,
  disabled,
  loading,
  pulsing,
  onClick,
  ariaLabel,
  type = 'button',
}: ButtonProps) {
  const classes = [
    'btn',
    `btn-${variant}`,
    size === 'lg' && 'btn-lg',
    block && 'btn-block',
    loading && 'btn-loading',
    pulsing && 'is-pulsing',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
    >
      {loading && <span className="spinner" aria-hidden="true" />}
      <span className="btn-label">{children}</span>
    </button>
  )
}

/* ---------- Campos ---------- */

interface FieldProps {
  label: string
  children: ReactNode
  error?: string | null
  hint?: string | null
}

export function Field({ label, children, error, hint }: FieldProps) {
  return (
    <div className="field">
      <span className="field-label t-label">{label}</span>
      {children}
      {error && <span className="field-error t-caption">{error}</span>}
      {!error && hint && <span className="field-hint t-caption">{hint}</span>}
    </div>
  )
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string
  error?: string | null
  hint?: string | null
  prefix?: string
}

export function TextField({ label, error, hint, prefix, ...input }: TextFieldProps) {
  return (
    <Field label={label} error={error} hint={hint}>
      <div className={`field-box${error ? ' is-error' : ''}`}>
        {prefix && (
          <span className="field-prefix t-body" aria-hidden="true">
            {prefix}
          </span>
        )}
        <input className="field-input" aria-label={label} {...input} />
      </div>
    </Field>
  )
}

/**
 * Campo de dinheiro com máscara de caixa eletrônico: você digita só números
 * e eles entram pela direita. "12000" vira 120,00.
 *
 * O estado é o valor em centavos, nunca a string — então não existe estado
 * intermediário inválido nem letra para escapar.
 */
export function MoneyField({
  label,
  cents,
  onChangeCents,
  hint,
  error,
  autoFocus,
}: {
  label: string
  cents: number
  onChangeCents: (cents: number) => void
  hint?: string | null
  error?: string | null
  autoFocus?: boolean
}) {
  // R$ 999.999,99 de teto: acima disso não é valor/hora, é dedo escorregando.
  const MAX_CENTS = 99_999_999

  function handleChange(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 9)
    onChangeCents(Math.min(MAX_CENTS, digits ? Number(digits) : 0))
  }

  return (
    <Field label={label} hint={hint} error={error}>
      <div className={`field-box${error ? ' is-error' : ''}`}>
        <span className="field-prefix t-body" aria-hidden="true">
          R$
        </span>
        <input
          className="field-input"
          // "numeric" abre o teclado só de dígitos; o filtro acima é a
          // garantia real, porque teclado é sugestão, não trava.
          inputMode="numeric"
          value={formatMoneyPlain(cents)}
          aria-label={label}
          autoFocus={autoFocus}
          onChange={(e) => handleChange(e.target.value)}
          // O cursor sempre no fim: com máscara da direita para a esquerda,
          // deixar o cursor no meio faz o valor pular de um jeito errático.
          onFocus={(e) => e.currentTarget.setSelectionRange(999, 999)}
          onClick={(e) => e.currentTarget.setSelectionRange(999, 999)}
        />
      </div>
    </Field>
  )
}

/**
 * Telefone com molde. Mesma ideia do MoneyField: o estado são só os dígitos,
 * a formatação é aparência — então não existe letra para escapar.
 */
export function PhoneField({
  label,
  digits,
  onChangeDigits,
  hint,
}: {
  label: string
  digits: string
  onChangeDigits: (digits: string) => void
  hint?: string | null
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="field-box">
        <input
          className="field-input"
          inputMode="tel"
          value={formatPhoneBR(digits)}
          placeholder="(00) 00000-0000"
          aria-label={label}
          onChange={(e) => onChangeDigits(onlyDigits(e.target.value))}
        />
      </div>
    </Field>
  )
}

interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  label: string
}

export function TextArea({ label, ...props }: TextAreaProps) {
  return (
    <Field label={label}>
      <div className="field-box">
        <textarea className="field-input" rows={2} aria-label={label} {...props} />
      </div>
    </Field>
  )
}

/** Campo que abre um seletor em vez de aceitar digitação. */
export function PickerField({
  label,
  value,
  placeholder,
  onClick,
  leading,
}: {
  label: string
  value: string | null
  placeholder: string
  onClick: () => void
  leading?: ReactNode
}) {
  return (
    <Field label={label}>
      <button type="button" className="field-box field-button" onClick={onClick}>
        {leading}
        <span className={`grow truncate t-body ${value ? '' : 'c-3'}`}>
          {value ?? placeholder}
        </span>
        <ChevronRight size={20} className="c-3" aria-hidden="true" />
      </button>
    </Field>
  )
}

/* ---------- Segmento ---------- */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div className="segmented" role="tablist" aria-label={label}>
      {options.map((opt) => (
        <button
          key={opt.value}
          role="tab"
          type="button"
          className="segmented-item"
          aria-selected={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

/* ---------- Interruptor ---------- */

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      className="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    />
  )
}

/* ---------- Selo ---------- */

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'success' | 'amber'
}) {
  const cls = tone === 'success' ? 'badge badge-success' : tone === 'amber' ? 'badge badge-amber' : 'badge'
  return <span className={`${cls} t-micro`}>{children}</span>
}

/* ---------- Barra de proporção / progresso ---------- */

export function Bar({
  value,
  color,
  over,
  animated,
  label,
}: {
  /** 0–1. Acima de 1 é tratado como cheio; o estouro é comunicado por texto. */
  value: number
  color?: string
  over?: boolean
  animated?: boolean
  label?: string
}) {
  const pct = Math.max(0, Math.min(1, value))
  return (
    <div
      className="bar-track"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct * 100)}
      aria-label={label}
    >
      <div
        className={`bar-fill${over ? ' is-over' : ''}${animated ? ' is-animated' : ''}`}
        style={
          {
            width: `${pct * 100}%`,
            '--client-color': color,
          } as React.CSSProperties
        }
      />
    </div>
  )
}

/* ---------- Bolinha de cor do cliente ---------- */

export function Dot({ color, small }: { color: string; small?: boolean }) {
  return (
    <span
      className={small ? 'dot dot-sm' : 'dot'}
      style={{ '--client-color': color } as React.CSSProperties}
      aria-hidden="true"
    />
  )
}

/* ---------- Estado vazio ---------- */

export function Empty({
  title,
  body,
  action,
}: {
  title: string
  body?: string
  action?: ReactNode
}) {
  return (
    <div className="empty">
      <h2 className="t-display">{title}</h2>
      {body && <p className="t-body">{body}</p>}
      {action}
    </div>
  )
}

/* ---------- Cabeçalho de tela ---------- */

export function ScreenHeader({
  title,
  leading,
  trailing,
}: {
  title: string
  leading?: ReactNode
  trailing?: ReactNode
}) {
  return (
    <header className="screen-header">
      {leading}
      <h1 className="t-h1 grow truncate">{title}</h1>
      {trailing}
    </header>
  )
}
