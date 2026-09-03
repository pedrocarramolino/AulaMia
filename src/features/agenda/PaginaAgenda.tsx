import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  addDays,
  addMonths,
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
} from 'date-fns'
import { es } from 'date-fns/locale/es'
import { Boton } from '@/components/ui'
import { Select } from '@/components/campos'
import { IconoFlechaIzq, IconoFlechaDer, IconoMas1 } from '@/components/iconos'
import { aISO, deISO, fechaLarga, mesLargo } from '@/lib/fechas'
import { useAlumnos } from '@/features/alumnos/api'
import { useMaterias } from '@/features/materias/api'
import { useClasesRango, type FiltrosAgenda } from './api'
import { VistaDia, VistaSemana, VistaMes, ListaDia } from './vistas'

type Vista = 'dia' | 'semana' | 'mes'
const VISTAS: { id: Vista; etiqueta: string }[] = [
  { id: 'dia', etiqueta: 'Día' },
  { id: 'semana', etiqueta: 'Semana' },
  { id: 'mes', etiqueta: 'Mes' },
]

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function PaginaAgenda() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  const vista = (params.get('v') as Vista) || 'dia'
  const fechaStr = params.get('f') || aISO(new Date())
  const fecha = useMemo(() => deISO(fechaStr), [fechaStr])

  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)
  const [filtros, setFiltros] = useState<FiltrosAgenda>({})

  const { data: alumnos } = useAlumnos()
  const { data: materias } = useMaterias()

  const setVista = (v: Vista) => {
    params.set('v', v)
    setParams(params, { replace: true })
  }
  const setFecha = (d: Date) => {
    params.set('f', aISO(d))
    setParams(params, { replace: true })
  }
  const irADia = (d: Date) => {
    params.set('f', aISO(d))
    params.set('v', 'dia')
    setParams(params, { replace: true })
  }

  const { desde, hasta, titulo } = useMemo(() => {
    if (vista === 'dia') {
      return { desde: aISO(fecha), hasta: aISO(fecha), titulo: cap(fechaLarga(fecha)) }
    }
    if (vista === 'semana') {
      const ini = startOfWeek(fecha, { weekStartsOn: 1 })
      const fin = endOfWeek(fecha, { weekStartsOn: 1 })
      const t =
        format(ini, 'd MMM', { locale: es }) + ' – ' + format(fin, 'd MMM yyyy', { locale: es })
      return { desde: aISO(ini), hasta: aISO(fin), titulo: t }
    }
    const ini = startOfWeek(startOfMonth(fecha), { weekStartsOn: 1 })
    const fin = endOfWeek(endOfMonth(fecha), { weekStartsOn: 1 })
    return { desde: aISO(ini), hasta: aISO(fin), titulo: cap(mesLargo(fecha)) }
  }, [vista, fecha])

  const { data: clases, isLoading } = useClasesRango(desde, hasta, filtros)

  const navegar = (dir: -1 | 1) => {
    if (vista === 'dia') setFecha(addDays(fecha, dir))
    else if (vista === 'semana') setFecha(addDays(fecha, dir * 7))
    else setFecha(addMonths(fecha, dir))
  }

  const clasesDelDiaSeleccionado =
    vista === 'mes' ? (clases ?? []).filter((c) => c.fecha === aISO(fecha)) : []

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="font-display text-xl font-bold tracking-tight text-ink md:text-2xl">
          Agenda
        </h1>
        <Boton onClick={() => navigate('/agenda/nueva')}>
          <IconoMas1 className="size-4" />
          <span className="hidden sm:inline">Nueva clase</span>
        </Boton>
      </div>

      {/* Selector de vista */}
      <div className="mb-3 inline-flex rounded-xl border border-line-strong bg-ground p-0.5">
        {VISTAS.map((v) => (
          <button
            key={v.id}
            onClick={() => setVista(v.id)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              vista === v.id ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
            }`}
          >
            {v.etiqueta}
          </button>
        ))}
      </div>

      {/* Navegación de fecha */}
      <div className="mb-3 flex items-center gap-2">
        <button
          onClick={() => navegar(-1)}
          aria-label="Anterior"
          className="grid size-9 place-items-center rounded-lg border border-line text-muted hover:bg-surface-2"
        >
          <IconoFlechaIzq className="size-4" />
        </button>
        <button
          onClick={() => navegar(1)}
          aria-label="Siguiente"
          className="grid size-9 place-items-center rounded-lg border border-line text-muted hover:bg-surface-2"
        >
          <IconoFlechaDer className="size-4" />
        </button>
        <button
          onClick={() => setFecha(new Date())}
          className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-muted hover:bg-surface-2"
        >
          Hoy
        </button>
        <p className="ml-1 truncate text-sm font-semibold text-ink">{titulo}</p>
        <button
          onClick={() => setFiltrosAbiertos((v) => !v)}
          className={`ml-auto rounded-lg border px-3 py-1.5 text-sm font-medium ${
            filtros.alumnoId || filtros.materiaId || filtros.incluirCanceladas
              ? 'border-accent bg-accent-soft text-accent-ink'
              : 'border-line text-muted hover:bg-surface-2'
          }`}
        >
          Filtros
        </button>
      </div>

      {filtrosAbiertos && (
        <div className="mb-3 flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-muted">
            Alumno
            <Select
              value={filtros.alumnoId ?? ''}
              onChange={(e) => setFiltros((f) => ({ ...f, alumnoId: e.target.value || undefined }))}
            >
              <option value="">Todos</option>
              {alumnos?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre} {a.apellidos ?? ''}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-muted">
            Materia
            <Select
              value={filtros.materiaId ?? ''}
              onChange={(e) => setFiltros((f) => ({ ...f, materiaId: e.target.value || undefined }))}
            >
              <option value="">Todas</option>
              {materias?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={filtros.incluirCanceladas ?? false}
              onChange={(e) =>
                setFiltros((f) => ({ ...f, incluirCanceladas: e.target.checked }))
              }
              className="size-4 rounded border-line-strong"
            />
            Ver canceladas
          </label>
          {(filtros.alumnoId || filtros.materiaId || filtros.incluirCanceladas) && (
            <button
              onClick={() => setFiltros({})}
              className="text-sm font-medium text-accent-ink hover:underline"
            >
              Limpiar
            </button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="h-96 animate-pulse rounded-2xl bg-surface-2" />
      ) : vista === 'dia' ? (
        <VistaDia
          fecha={fecha}
          clases={clases ?? []}
          onClickClase={(id) => navigate(`/agenda/clase/${id}`)}
        />
      ) : vista === 'semana' ? (
        <VistaSemana
          fecha={fecha}
          clases={clases ?? []}
          onClickClase={(id) => navigate(`/agenda/clase/${id}`)}
          onDia={irADia}
        />
      ) : (
        <>
          <VistaMes fecha={fecha} clases={clases ?? []} onDia={irADia} />
          <div className="mt-4">
            <h2 className="mb-2 text-sm font-semibold text-ink">{cap(fechaLarga(fecha))}</h2>
            <ListaDia
              clases={clasesDelDiaSeleccionado}
              onClickClase={(id) => navigate(`/agenda/clase/${id}`)}
            />
          </div>
        </>
      )}
    </>
  )
}
