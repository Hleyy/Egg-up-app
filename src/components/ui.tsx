import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function Screen({ title, back, actions, children }: { title?: string; back?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col gap-4 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      {(title || back || actions) && (
        <header className="flex items-center gap-2">
          {back && (
            <Link to={back} className="rounded-ui px-2 py-1 text-ink-muted" aria-label="Back">
              ←
            </Link>
          )}
          {title && <h1 className="flex-1 font-display text-xl font-bold">{title}</h1>}
          {actions}
        </header>
      )}
      {children}
    </div>
  )
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink',
  secondary: 'bg-surface text-ink border border-line',
  ghost: 'text-ink-muted',
  danger: 'bg-surface text-danger border border-danger',
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={`rounded-ui px-4 py-3 font-semibold transition active:scale-[0.98] disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  )
}

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-ui border border-line bg-surface p-4 ${className}`}>{children}</div>
}

export function Segmented<T extends string | number>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-ui bg-surface-muted p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-ui px-3 py-2 text-sm font-semibold ${o.value === value ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Stepper({ label, onMinus, onPlus, children }: { label: string; onMinus: () => void; onPlus: () => void; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-1">
      <span className="text-sm text-ink-muted">{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onMinus} aria-label={`${label} −1`} className="size-8 rounded-ui border border-line bg-surface">−</button>
        <span className="min-w-10 text-center font-semibold tabular-nums">{children}</span>
        <button type="button" onClick={onPlus} aria-label={`${label} +1`} className="size-8 rounded-ui border border-line bg-surface">+</button>
      </div>
    </div>
  )
}

export function ConfirmDialog({ open, message, confirmLabel, cancelLabel, onConfirm, onCancel }: { open: boolean; message: string; confirmLabel: string; cancelLabel: string; onConfirm: () => void; onCancel: () => void }) {
  if (!open) return null
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <Card className="w-full max-w-sm space-y-4">
        <p>{message}</p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant="danger" className="flex-1" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </Card>
    </div>
  )
}

export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
