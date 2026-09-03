import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

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
        <p className="text-xs text-crit">{error}</p>
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
    <select className={`${base} appearance-none pr-9 ${className}`} {...props}>
      {children}
    </select>
  )
}
