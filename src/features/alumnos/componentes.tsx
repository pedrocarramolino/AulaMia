import { PALETA_ALUMNOS } from '@/lib/colores'

/** Iniciales de un nombre completo. */
export function iniciales(nombre: string, apellidos?: string | null): string {
  const a = nombre.trim()[0] ?? ''
  const b = (apellidos?.trim()[0] ?? nombre.trim().split(/\s+/)[1]?.[0]) ?? ''
  return (a + b).toUpperCase()
}

export function AvatarAlumno({
  nombre,
  apellidos,
  color,
  tam = 'md',
}: {
  nombre: string
  apellidos?: string | null
  color: string
  tam?: 'sm' | 'md' | 'lg'
}) {
  const clase =
    tam === 'lg'
      ? 'size-12 text-base'
      : tam === 'sm'
        ? 'size-8 text-xs'
        : 'size-10 text-sm'
  return (
    <span
      className={`flex ${clase} shrink-0 items-center justify-center rounded-full font-semibold text-white`}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      {iniciales(nombre, apellidos)}
    </span>
  )
}

const PRIORIDADES = [
  { valor: 1, etiqueta: 'Baja' },
  { valor: 2, etiqueta: 'Media' },
  { valor: 3, etiqueta: 'Alta' },
] as const

export function SelectorPrioridad({
  valor,
  onChange,
}: {
  valor: number
  onChange: (v: number) => void
}) {
  return (
    <div className="inline-flex rounded-xl border border-line-strong bg-ground p-0.5">
      {PRIORIDADES.map((p) => (
        <button
          key={p.valor}
          type="button"
          aria-pressed={valor === p.valor}
          onClick={() => onChange(p.valor)}
          className={[
            'rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors',
            valor === p.valor
              ? 'bg-surface text-ink shadow-sm'
              : 'text-muted hover:text-ink',
          ].join(' ')}
        >
          {p.etiqueta}
        </button>
      ))}
    </div>
  )
}

export function EtiquetaPrioridad({ valor }: { valor: number }) {
  const p = PRIORIDADES.find((x) => x.valor === valor) ?? PRIORIDADES[1]
  const clase =
    valor === 3
      ? 'bg-warn-soft text-warn'
      : valor === 1
        ? 'bg-surface-2 text-muted'
        : 'bg-accent-soft text-accent-ink'
  return (
    <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${clase}`}>
      Prioridad {p.etiqueta.toLowerCase()}
    </span>
  )
}

export function SelectorColor({
  valor,
  onChange,
}: {
  valor: string
  onChange: (hex: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {PALETA_ALUMNOS.map((c) => {
        const activo = c.hex.toLowerCase() === valor.toLowerCase()
        return (
          <button
            key={c.hex}
            type="button"
            title={c.nombre}
            aria-label={c.nombre}
            aria-pressed={activo}
            onClick={() => onChange(c.hex)}
            className={[
              'size-9 rounded-full transition-transform',
              activo
                ? 'ring-2 ring-ink ring-offset-2 ring-offset-surface'
                : 'hover:scale-110',
            ].join(' ')}
            style={{ backgroundColor: c.hex }}
          />
        )
      })}
    </div>
  )
}
