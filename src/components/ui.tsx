import { useEffect } from 'react'
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

type Variante = 'primario' | 'secundario' | 'peligro' | 'fantasma'

const VARIANTES: Record<Variante, string> = {
  primario: 'bg-accent text-white hover:brightness-110 active:brightness-95',
  secundario: 'border border-line-strong bg-surface text-ink hover:bg-surface-2',
  peligro: 'border border-crit/40 bg-crit-soft text-crit hover:brightness-105',
  fantasma: 'text-accent-ink hover:bg-accent-soft',
}

/** Botón. `variante` por defecto: primario. */
export function Boton({
  children,
  className = '',
  variante = 'primario',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5',
        'text-sm font-semibold transition-[filter,background-color] disabled:opacity-50',
        VARIANTES[variante],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}

/** Contenedor modal genérico (overlay + tarjeta). */
export function Modal({
  abierto,
  titulo,
  onCerrar,
  children,
}: {
  abierto: boolean
  titulo: string
  onCerrar: () => void
  children: ReactNode
}) {
  useEffect(() => {
    if (!abierto) return
    const alPulsar = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    document.addEventListener('keydown', alPulsar)
    return () => document.removeEventListener('keydown', alPulsar)
  }, [abierto, onCerrar])

  if (!abierto) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
      onClick={onCerrar}
      role="presentation"
    >
      <div
        className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-surface p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
      >
        <h2 className="font-display text-lg font-semibold text-ink">{titulo}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

/** Diálogo de confirmación centrado. Se controla con `abierto`. */
export function ConfirmarDialogo({
  abierto,
  titulo,
  texto,
  confirmar = 'Confirmar',
  cancelar = 'Cancelar',
  peligro = false,
  onConfirmar,
  onCancelar,
}: {
  abierto: boolean
  titulo: string
  texto?: string
  confirmar?: string
  cancelar?: string
  peligro?: boolean
  onConfirmar: () => void
  onCancelar: () => void
}) {
  useEffect(() => {
    if (!abierto) return
    const alPulsar = (e: KeyboardEvent) => e.key === 'Escape' && onCancelar()
    document.addEventListener('keydown', alPulsar)
    return () => document.removeEventListener('keydown', alPulsar)
  }, [abierto, onCancelar])

  if (!abierto) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
      onClick={onCancelar}
      role="presentation"
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-label={titulo}
      >
        <h2 className="font-display text-lg font-semibold text-ink">{titulo}</h2>
        {texto && <p className="mt-1.5 text-sm text-muted">{texto}</p>}
        <div className="mt-5 flex gap-2">
          <Boton variante="secundario" className="flex-1" onClick={onCancelar}>
            {cancelar}
          </Boton>
          <Boton
            variante={peligro ? 'peligro' : 'primario'}
            className="flex-1"
            onClick={onConfirmar}
          >
            {confirmar}
          </Boton>
        </div>
      </div>
    </div>
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
