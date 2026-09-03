import { relativo } from '@/lib/fechas'
import { useCambiosDeClase, type CambioClase } from './api'

const ETIQUETA: Record<CambioClase['tipo'], string> = {
  cancelada: 'Cancelada',
  cambio_fecha: 'Cambio de fecha',
  cambio_hora: 'Cambio de hora',
  cambio_duracion: 'Cambio de duración',
  recuperada: 'Recuperación creada',
  reactivada: 'Reactivada',
}

export function HistorialCambios({ claseId }: { claseId: string }) {
  const { data: cambios } = useCambiosDeClase(claseId)

  if (!cambios?.length) return null

  return (
    <section className="mt-8">
      <h2 className="mb-2 text-sm font-semibold text-ink">Historial de cambios</h2>
      <ul className="flex flex-col gap-2">
        {cambios.map((c) => (
          <li key={c.id} className="rounded-xl border border-line bg-surface px-3 py-2 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-medium text-ink">{ETIQUETA[c.tipo]}</span>
              <span className="shrink-0 font-mono text-[11px] text-muted">
                {relativo(c.creado_en)}
              </span>
            </div>
            {c.motivo && <p className="mt-0.5 text-muted">{c.motivo}</p>}
          </li>
        ))}
      </ul>
    </section>
  )
}
