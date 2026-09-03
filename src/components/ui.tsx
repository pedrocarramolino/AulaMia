import type { ButtonHTMLAttributes, ReactNode } from 'react'

/** Cabecera estándar de una página: título, subtítulo opcional y acción a la derecha. */
export function CabeceraPagina({
  titulo,
  subtitulo,
  accion,
}: {
  titulo: string
  subtitulo?: string
  accion?: ReactNode
}) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
          {titulo}
        </h1>
        {subtitulo && <p className="mt-1 text-sm text-muted">{subtitulo}</p>}
      </div>
      {accion && <div className="shrink-0">{accion}</div>}
    </header>
  )
}

/** Estado vacío o "en construcción". */
export function EstadoVacio({
  icono,
  titulo,
  texto,
  accion,
}: {
  icono?: ReactNode
  titulo: string
  texto?: string
  accion?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
      {icono && <div className="mb-4 text-muted">{icono}</div>}
      <h2 className="font-display text-lg font-semibold text-ink">{titulo}</h2>
      {texto && <p className="mt-1.5 max-w-sm text-sm text-muted">{texto}</p>}
      {accion && <div className="mt-5">{accion}</div>}
    </div>
  )
}

/** Indicador de carga a pantalla completa. */
export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-ground">
      <div className="size-7 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
      <p className="font-mono text-xs text-muted">{texto}</p>
    </div>
  )
}

/** Botón primario. */
export function Boton({
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5',
        'text-sm font-semibold text-white transition-[filter,opacity]',
        'hover:brightness-110 active:brightness-95 disabled:opacity-50',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}

/** Tarjeta contenedora. */
export function Tarjeta({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={[
        'rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(20,25,40,0.04)]',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
