import { DIAS_AVISO, etiquetaDias } from './avisos'

export function SelectorDiasAviso({
  valor,
  onChange,
}: {
  valor: number[]
  onChange: (dias: number[]) => void
}) {
  const alternar = (d: number) =>
    onChange(valor.includes(d) ? valor.filter((x) => x !== d) : [...valor, d].sort((a, b) => b - a))

  return (
    <div className="flex flex-wrap gap-2">
      {DIAS_AVISO.map((d) => {
        const activo = valor.includes(d)
        return (
          <button
            key={d}
            type="button"
            aria-pressed={activo}
            onClick={() => alternar(d)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              activo
                ? 'border-accent bg-accent-soft text-accent-ink'
                : 'border-line text-muted hover:bg-surface-2'
            }`}
          >
            {etiquetaDias(d)}
          </button>
        )
      })}
    </div>
  )
}
