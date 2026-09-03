import { useMemo } from 'react'
import {
  isSameDay,
  isSameMonth,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from 'date-fns'
import { aISO, diaCompacto, DIAS_ABREV, diasDeLaSemana } from '@/lib/fechas'
import type { ClaseAgenda } from './api'
import { calcularRejilla } from './rejilla'
import { EjeHoras, ColumnaDia, FilaClase } from './componentes'

function agrupaPorFecha(clases: ClaseAgenda[]): Map<string, ClaseAgenda[]> {
  const m = new Map<string, ClaseAgenda[]>()
  for (const c of clases) {
    const arr = m.get(c.fecha) ?? []
    arr.push(c)
    m.set(c.fecha, arr)
  }
  return m
}

// ---------------------------------------------------------------------------
// Día
// ---------------------------------------------------------------------------

export function VistaDia({
  fecha,
  clases,
  onClickClase,
}: {
  fecha: Date
  clases: ClaseAgenda[]
  onClickClase: (id: string) => void
}) {
  const delDia = clases.filter((c) => c.fecha === aISO(fecha))
  const cfg = useMemo(() => calcularRejilla(delDia, 64), [delDia])

  return (
    <div className="rounded-2xl border border-line bg-surface p-3">
      {delDia.length === 0 && (
        <p className="px-2 pb-2 pt-1 text-sm text-muted">Día libre. Sin clases.</p>
      )}
      <div className="flex overflow-x-auto">
        <EjeHoras cfg={cfg} />
        <ColumnaDia
          clases={delDia}
          cfg={cfg}
          esHoy={isSameDay(fecha, new Date())}
          onClickClase={onClickClase}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Semana
// ---------------------------------------------------------------------------

export function VistaSemana({
  fecha,
  clases,
  onClickClase,
  onDia,
}: {
  fecha: Date
  clases: ClaseAgenda[]
  onClickClase: (id: string) => void
  onDia: (d: Date) => void
}) {
  const dias = diasDeLaSemana(fecha)
  const cfg = useMemo(() => calcularRejilla(clases, 52), [clases])
  const porFecha = agrupaPorFecha(clases)
  const hoy = new Date()

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <div className="min-w-[42rem]">
        <div className="sticky top-0 z-10 flex border-b border-line bg-surface/95 backdrop-blur">
          <div className="w-12 shrink-0" />
          {dias.map((d) => {
            const esHoy = isSameDay(d, hoy)
            return (
              <button
                key={d.toISOString()}
                onClick={() => onDia(d)}
                className={`flex-1 border-l border-line py-2 text-center text-xs font-medium capitalize transition-colors hover:bg-surface-2 ${
                  esHoy ? 'text-accent-ink' : 'text-muted'
                }`}
              >
                {diaCompacto(d)}
              </button>
            )
          })}
        </div>
        <div className="flex p-2">
          <EjeHoras cfg={cfg} />
          {dias.map((d) => (
            <ColumnaDia
              key={d.toISOString()}
              clases={porFecha.get(aISO(d)) ?? []}
              cfg={cfg}
              esHoy={isSameDay(d, hoy)}
              onClickClase={onClickClase}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Mes
// ---------------------------------------------------------------------------

export function VistaMes({
  fecha,
  clases,
  onDia,
}: {
  fecha: Date
  clases: ClaseAgenda[]
  onDia: (d: Date) => void
}) {
  const inicio = startOfWeek(startOfMonth(fecha), { weekStartsOn: 1 })
  const fin = endOfWeek(endOfMonth(fecha), { weekStartsOn: 1 })
  const dias = eachDayOfInterval({ start: inicio, end: fin })
  const porFecha = agrupaPorFecha(clases)
  const hoy = new Date()

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="grid grid-cols-7 border-b border-line bg-surface-2">
        {DIAS_ABREV.map((d) => (
          <div key={d} className="py-1.5 text-center text-[11px] font-semibold text-muted">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {dias.map((d) => {
          const delDia = porFecha.get(aISO(d)) ?? []
          const activas = delDia.filter((c) => c.estado !== 'cancelada')
          const fuera = !isSameMonth(d, fecha)
          const esHoy = isSameDay(d, hoy)
          return (
            <button
              key={d.toISOString()}
              onClick={() => onDia(d)}
              className={`flex min-h-[4.5rem] flex-col gap-1 border-b border-l border-line p-1.5 text-left transition-colors hover:bg-surface-2 [&:nth-child(7n+1)]:border-l-0 ${
                fuera ? 'bg-surface-2/40' : ''
              }`}
            >
              <span
                className={`text-xs font-medium ${
                  esHoy
                    ? 'grid size-5 place-items-center rounded-full bg-accent text-white'
                    : fuera
                      ? 'text-muted'
                      : 'text-ink'
                }`}
              >
                {d.getDate()}
              </span>
              <span className="flex flex-wrap gap-0.5">
                {activas.slice(0, 4).map((c) => (
                  <span
                    key={c.id}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: c.alumno.color }}
                  />
                ))}
                {activas.length > 4 && (
                  <span className="text-[9px] font-medium text-muted">
                    +{activas.length - 4}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Lista de un día concreto (para el mes cuando se selecciona un día en móvil)
// ---------------------------------------------------------------------------

export function ListaDia({
  clases,
  onClickClase,
}: {
  clases: ClaseAgenda[]
  onClickClase: (id: string) => void
}) {
  if (!clases.length) {
    return <p className="py-6 text-center text-sm text-muted">Sin clases este día.</p>
  }
  return (
    <div className="flex flex-col gap-2">
      {clases.map((c) => (
        <FilaClase key={c.id} clase={c} onClick={onClickClase} />
      ))}
    </div>
  )
}
