import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { addDays, startOfMonth } from 'date-fns'
import { CabeceraPagina, Tarjeta } from '@/components/ui'
import { IconoFlechaIzq } from '@/components/iconos'
import { aISO, aMinutos, duracionLegible, DIAS_ABREV, diaSemanaISO, deISO } from '@/lib/fechas'
import { useClasesRango, type ClaseAgenda } from '@/features/agenda/api'
import { useDisponibilidad } from '@/features/disponibilidad/api'

type Periodo = '7' | '30' | 'mes'

const dur = (c: ClaseAgenda) => aMinutos(c.hora_fin) - aMinutos(c.hora_inicio)

type Fila = { etiqueta: string; valor: number; color?: string }

function valorTexto(v: number, unidad: string) {
  return unidad === 'h' ? `${v.toFixed(1)} h` : String(Math.round(v))
}

function Grafico({
  titulo,
  filas,
  unidad = 'h',
  formato,
}: {
  titulo: string
  filas: Fila[]
  unidad?: string
  formato: 'grafica' | 'tabla'
}) {
  const max = Math.max(...filas.map((f) => f.valor), 1)
  const total = filas.reduce((s, f) => s + f.valor, 0)

  if (formato === 'tabla') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">{titulo}</caption>
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th scope="col" className="py-1.5 font-medium">Concepto</th>
              <th scope="col" className="py-1.5 text-right font-medium">Valor</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.etiqueta} className="border-b border-line last:border-0">
                <th scope="row" className="py-1.5 text-left font-normal text-ink">{f.etiqueta}</th>
                <td className="py-1.5 text-right font-mono tabular-nums text-ink">
                  {valorTexto(f.valor, unidad)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col gap-2"
      role="img"
      aria-label={`${titulo}. ${filas
        .map((f) => `${f.etiqueta}: ${valorTexto(f.valor, unidad)}`)
        .join('. ')}. Total ${valorTexto(total, unidad)}.`}
    >
      {filas.map((f) => (
        <div
          key={f.etiqueta}
          className="flex items-center gap-2 text-sm"
          title={`${f.etiqueta}: ${valorTexto(f.valor, unidad)}`}
        >
          <span className="w-16 shrink-0 truncate text-xs text-muted">{f.etiqueta}</span>
          <div className="h-5 flex-1 overflow-hidden rounded bg-surface-2">
            <div
              className="h-full rounded"
              style={{
                width: `${Math.max((f.valor / max) * 100, f.valor > 0 ? 4 : 0)}%`,
                backgroundColor: f.color ?? 'var(--accent)',
              }}
            />
          </div>
          <span className="w-14 shrink-0 text-right font-mono text-xs tabular-nums text-ink">
            {valorTexto(f.valor, unidad)}
          </span>
        </div>
      ))}
    </div>
  )
}

function Cifra({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-3 text-center">
      <p className="font-display text-xl font-bold text-ink">{v}</p>
      <p className="text-[11px] text-muted">{k}</p>
    </div>
  )
}

export function PaginaEstadisticas() {
  const [periodo, setPeriodo] = useState<Periodo>('30')
  const [formato, setFormato] = useState<'grafica' | 'tabla'>('grafica')
  const hoy = new Date()

  const desde =
    periodo === 'mes' ? aISO(startOfMonth(hoy)) : aISO(addDays(hoy, periodo === '7' ? -7 : -30))
  const hasta = aISO(hoy)

  const { data: clases, isLoading } = useClasesRango(desde, hasta, { incluirCanceladas: true })
  const { data: disponibilidad } = useDisponibilidad()

  const vm = useMemo(() => {
    const lista = clases ?? []
    const realizadas = lista.filter((c) => c.estado === 'realizada')
    const canceladas = lista.filter((c) => c.estado === 'cancelada')
    const minImpartidos = realizadas.reduce((s, c) => s + dur(c), 0)

    const alumnos = new Set(realizadas.map((c) => c.alumno_id))

    // horas por día de la semana
    const porDia = DIAS_ABREV.map((d, i) => ({
      etiqueta: d,
      valor:
        realizadas
          .filter((c) => diaSemanaISO(deISO(c.fecha)) === i + 1)
          .reduce((s, c) => s + dur(c), 0) / 60,
    }))

    // horas por alumno
    const mapa = new Map<string, { etiqueta: string; valor: number; color: string }>()
    for (const c of realizadas) {
      const e = mapa.get(c.alumno_id) ?? {
        etiqueta: c.alumno.nombre,
        valor: 0,
        color: c.alumno.color,
      }
      e.valor += dur(c) / 60
      mapa.set(c.alumno_id, e)
    }
    const porAlumno = [...mapa.values()].sort((a, b) => b.valor - a.valor)

    // ocupación: disponibilidad semanal * nº de semanas del periodo
    const semanas = Math.max(
      (deISO(hasta).getTime() - deISO(desde).getTime()) / (7 * 86400000),
      0.1,
    )
    const minDispSemana = (disponibilidad ?? []).reduce(
      (s, t) => s + aMinutos(t.hora_fin) - aMinutos(t.hora_inicio),
      0,
    )
    const horasDisp = (minDispSemana * semanas) / 60
    const horasOcup = minImpartidos / 60
    const horasLibres = Math.max(horasDisp - horasOcup, 0)

    const ingresos = realizadas
      .filter((c) => c.cobrada && c.precio)
      .reduce((s, c) => s + (c.precio ?? 0), 0)
    const pendienteCobro = realizadas
      .filter((c) => !c.cobrada && c.precio)
      .reduce((s, c) => s + (c.precio ?? 0), 0)

    return {
      realizadas: realizadas.length,
      canceladas: canceladas.length,
      minImpartidos,
      nAlumnos: alumnos.size,
      porDia,
      porAlumno,
      horasOcup,
      horasLibres,
      horasDisp,
      ingresos,
      pendienteCobro,
    }
  }, [clases, disponibilidad, desde, hasta])

  return (
    <>
      <Link
        to="/mas"
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
      >
        <IconoFlechaIzq className="size-4" /> Más
      </Link>
      <CabeceraPagina titulo="Estadísticas" />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-xl border border-line-strong bg-ground p-0.5">
          {(
            [
              ['7', '7 días'],
              ['30', '30 días'],
              ['mes', 'Este mes'],
            ] as const
          ).map(([id, txt]) => (
            <button
              key={id}
              onClick={() => setPeriodo(id)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                periodo === id ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              {txt}
            </button>
          ))}
        </div>
        <button
          onClick={() => setFormato((f) => (f === 'grafica' ? 'tabla' : 'grafica'))}
          className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-muted hover:bg-surface-2"
        >
          {formato === 'grafica' ? 'Ver como tabla' : 'Ver como gráfica'}
        </button>
      </div>

      {isLoading ? (
        <div className="h-96 animate-pulse rounded-2xl bg-surface-2" />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Cifra k="Clases dadas" v={vm.realizadas.toString()} />
            <Cifra k="Horas" v={duracionLegible(vm.minImpartidos)} />
            <Cifra k="Alumnos" v={vm.nAlumnos.toString()} />
            <Cifra k="Canceladas" v={vm.canceladas.toString()} />
          </div>

          <Tarjeta>
            <h2 className="mb-3 font-display text-base font-semibold text-ink">
              Horas por día de la semana
            </h2>
            <Grafico titulo="Horas por día de la semana" filas={vm.porDia} formato={formato} />
          </Tarjeta>

          {vm.porAlumno.length > 0 && (
            <Tarjeta>
              <h2 className="mb-3 font-display text-base font-semibold text-ink">Horas por alumno</h2>
              <Grafico titulo="Horas por alumno" filas={vm.porAlumno} formato={formato} />
            </Tarjeta>
          )}

          <Tarjeta>
            <h2 className="mb-2 font-display text-base font-semibold text-ink">Ocupación</h2>
            <div className="flex h-6 overflow-hidden rounded-lg bg-surface-2">
              <div
                className="h-full bg-accent"
                style={{
                  width: `${vm.horasDisp > 0 ? Math.min((vm.horasOcup / vm.horasDisp) * 100, 100) : 0}%`,
                }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted">
              <span>
                <span className="mr-1 inline-block size-2 rounded-full bg-accent align-middle" />
                {vm.horasOcup.toFixed(1)} h ocupadas
              </span>
              <span>{vm.horasLibres.toFixed(1)} h libres</span>
            </div>
          </Tarjeta>

          {(vm.ingresos > 0 || vm.pendienteCobro > 0) && (
            <Tarjeta>
              <h2 className="mb-2 font-display text-base font-semibold text-ink">Cobros</h2>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Cobrado</span>
                <span className="font-medium text-ink">{vm.ingresos.toFixed(2)} €</span>
              </div>
              {vm.pendienteCobro > 0 && (
                <div className="mt-1 flex justify-between text-sm">
                  <span className="text-muted">Pendiente</span>
                  <span className="font-medium text-warn">{vm.pendienteCobro.toFixed(2)} €</span>
                </div>
              )}
            </Tarjeta>
          )}
        </div>
      )}
    </>
  )
}
