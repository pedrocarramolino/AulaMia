import { diasRestantes } from '@/lib/fechas'

const NIVEL_TXT = ['', 'Sin empezar', 'Flojo', 'A medias', 'Casi listo', 'Preparado']

export function NivelPreparacion({
  valor,
  onChange,
  editable = true,
}: {
  valor: number
  onChange?: (v: number) => void
  editable?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={!editable}
            aria-label={`Nivel ${n}`}
            onClick={() => onChange?.(n)}
            className={`size-6 rounded-full border transition-colors ${
              n <= valor ? 'border-good bg-good' : 'border-line-strong bg-ground'
            } ${editable ? 'hover:border-good' : ''}`}
          />
        ))}
      </div>
      <span className="text-xs text-muted">{NIVEL_TXT[valor] ?? ''}</span>
    </div>
  )
}

export function DiasBadge({ fecha }: { fecha: string }) {
  const d = diasRestantes(fecha)
  let clase = 'bg-surface-2 text-muted'
  let texto: string

  if (d < 0) {
    texto = 'Pasado'
  } else if (d === 0) {
    texto = 'Hoy'
    clase = 'bg-crit-soft text-crit'
  } else if (d === 1) {
    texto = 'Mañana'
    clase = 'bg-crit-soft text-crit'
  } else {
    texto = `En ${d} días`
    if (d <= 3) clase = 'bg-crit-soft text-crit'
    else if (d <= 7) clase = 'bg-warn-soft text-warn'
  }

  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${clase}`}>{texto}</span>
  )
}
