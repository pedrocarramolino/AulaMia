import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { IconoAgenda, IconoChevronAbajo } from './iconos'
import { fechaCorta } from '@/lib/fechas'

const base =
  'w-full rounded-xl border border-line-strong bg-ground px-3.5 py-2.5 text-sm text-ink ' +
  'outline-none transition-colors placeholder:text-muted focus:border-accent ' +
  'disabled:opacity-60'

/** Envoltura etiqueta + campo + ayuda/error. */
export function Campo({
  etiqueta,
  htmlFor,
  ayuda,
  error,
  obligatorio,
  children,
}: {
  etiqueta: string
  htmlFor?: string
  ayuda?: string
  error?: string
  obligatorio?: boolean
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {etiqueta}
        {obligatorio && <span className="text-crit"> *</span>}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-crit">{error}</p>
      ) : (
        ayuda && <p className="text-xs text-muted">{ayuda}</p>
      )}
    </div>
  )
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${base} ${className}`} {...props} />
}

export function Textarea({
  className = '',
  rows = 3,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={rows} className={`${base} resize-y ${className}`} {...props} />
}

export function Select({
  className = '',
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={`${base} appearance-none pr-9 ${className}`} {...props}>
        {children}
      </select>
      <IconoChevronAbajo className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
    </div>
  )
}

/**
 * Campo de fecha con estilo propio: muestra DD/MM/AAAA (o un texto de
 * relleno) en vez del control nativo del navegador. El <input type="date">
 * real queda invisible encima para seguir usando el selector nativo del
 * sistema al tocar/hacer clic.
 */
export function InputFecha({
  id,
  value,
  onChange,
  min,
  max,
  required,
  placeholder = 'Elegir fecha',
  className = '',
}: {
  id?: string
  value: string
  onChange: (valor: string) => void
  min?: string
  max?: string
  required?: boolean
  placeholder?: string
  className?: string
}) {
  return (
    <div className={`relative ${className}`}>
      <div
        className={`${base} flex items-center justify-between gap-2 ${value ? '' : 'text-muted'}`}
      >
        <span>{value ? fechaCorta(value) : placeholder}</span>
        <IconoAgenda className="size-4 shrink-0 text-muted" />
      </div>
      <input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        required={required}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  )
}
