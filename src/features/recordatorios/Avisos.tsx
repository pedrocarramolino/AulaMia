import { useNavigate } from 'react-router-dom'
import type { ComponentType, SVGProps } from 'react'
import { relativo } from '@/lib/fechas'
import { IconoReloj, IconoExamenes, IconoDeshacer, IconoAviso } from '@/components/iconos'
import {
  useRecordatoriosActivos,
  useMarcarVisto,
  useMarcarTodosVistos,
  type Recordatorio,
} from './api'

const ICONO: Record<Recordatorio['tipo'], ComponentType<SVGProps<SVGSVGElement>>> = {
  clase: IconoReloj,
  examen: IconoExamenes,
  recuperacion: IconoDeshacer,
  inactividad: IconoAviso,
}

function destino(r: Recordatorio): string {
  if (r.ref_tipo === 'examen') return `/examenes/${r.ref_id}`
  return `/agenda/clase/${r.ref_id}`
}

export function Avisos() {
  const navigate = useNavigate()
  const { data: avisos } = useRecordatoriosActivos()
  const marcar = useMarcarVisto()
  const marcarTodos = useMarcarTodosVistos()

  if (!avisos?.length) return null

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
          Avisos ({avisos.length})
        </p>
        {avisos.length > 1 && (
          <button
            onClick={() => marcarTodos.mutate(avisos.map((a) => a.id))}
            className="text-xs font-medium text-accent-ink hover:underline"
          >
            Descartar todos
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {avisos.map((a) => {
          const Icono = ICONO[a.tipo]
          return (
          <div
            key={a.id}
            className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5"
          >
            <Icono aria-hidden className="size-5 shrink-0 text-muted" />
            <button
              onClick={() => navigate(destino(a))}
              className="min-w-0 flex-1 text-left"
            >
              <p className="truncate text-sm font-medium text-ink">{a.mensaje}</p>
              <p className="font-mono text-[11px] text-muted">{relativo(a.dispara_en)}</p>
            </button>
            <button
              onClick={() => marcar.mutate(a.id)}
              aria-label="Descartar"
              className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-surface-2 hover:text-ink"
            >
              Visto
            </button>
          </div>
          )
        })}
      </div>
    </section>
  )
}
