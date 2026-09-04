import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { addDays } from 'date-fns'
import { CabeceraPagina, Boton, Tarjeta, ConfirmarDialogo } from '@/components/ui'
import { Input, Select } from '@/components/campos'
import { IconoFlechaIzq, IconoMas1, IconoX } from '@/components/iconos'
import { DIAS_SEMANA, franja, aMinutos, fechaCorta, aISO, deISO } from '@/lib/fechas'
import {
  useDisponibilidad,
  useCrearTramo,
  useEliminarTramo,
  useReemplazarDia,
  useExcepciones,
  useCrearExcepcion,
  useEliminarExcepcion,
  type Tramo,
  type Excepcion,
} from './api'

const MAX_DIAS_RANGO = 90

/** Días de fecha1 a fecha2 (ISO), ambos incluidos. */
function rangoFechas(fecha1: string, fecha2: string): string[] {
  const dias: string[] = []
  let d = deISO(fecha1)
  const fin = deISO(fecha2)
  while (d <= fin) {
    dias.push(aISO(d))
    d = addDays(d, 1)
  }
  return dias
}

interface GrupoExcepcion {
  ids: string[]
  fechaDesde: string
  fechaHasta: string
  tipo: Excepcion['tipo']
  hora_inicio: string | null
  hora_fin: string | null
  motivo: string | null
}

/** Agrupa excepciones consecutivas (mismo tipo/horario/motivo) en un solo bloque. */
function agruparExcepciones(excepciones: Excepcion[]): GrupoExcepcion[] {
  const grupos: GrupoExcepcion[] = []
  for (const e of excepciones) {
    const anterior = grupos.at(-1)
    const siguiente =
      anterior &&
      anterior.tipo === e.tipo &&
      anterior.hora_inicio === e.hora_inicio &&
      anterior.hora_fin === e.hora_fin &&
      anterior.motivo === e.motivo &&
      aISO(addDays(deISO(anterior.fechaHasta), 1)) === e.fecha
    if (siguiente && anterior) {
      anterior.ids.push(e.id)
      anterior.fechaHasta = e.fecha
    } else {
      grupos.push({
        ids: [e.id],
        fechaDesde: e.fecha,
        fechaHasta: e.fecha,
        tipo: e.tipo,
        hora_inicio: e.hora_inicio,
        hora_fin: e.hora_fin,
        motivo: e.motivo,
      })
    }
  }
  return grupos
}

function solapaExistente(
  tramos: Tramo[],
  inicio: string,
  fin: string,
): boolean {
  const i = aMinutos(inicio)
  const f = aMinutos(fin)
  return tramos.some((t) => i < aMinutos(t.hora_fin) && f > aMinutos(t.hora_inicio))
}

function FilaDia({
  dia,
  nombre,
  tramos,
  puedeCopiar,
  onCopiarLaborables,
}: {
  dia: number
  nombre: string
  tramos: Tramo[]
  puedeCopiar: boolean
  onCopiarLaborables: () => void
}) {
  const crear = useCrearTramo()
  const eliminar = useEliminarTramo()
  const [anadiendo, setAnadiendo] = useState(false)
  const [inicio, setInicio] = useState('16:00')
  const [fin, setFin] = useState('20:00')
  const [error, setError] = useState('')

  async function anadir(e: FormEvent) {
    e.preventDefault()
    if (aMinutos(fin) <= aMinutos(inicio)) {
      setError('La hora de fin debe ser posterior.')
      return
    }
    if (solapaExistente(tramos, inicio, fin)) {
      setError('Se solapa con otro tramo de este día.')
      return
    }
    await crear.mutateAsync({ dia_semana: dia, hora_inicio: inicio, hora_fin: fin })
    setError('')
    setAnadiendo(false)
  }

  return (
    <div className="flex flex-col gap-2 border-b border-line py-3 last:border-0">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">{nombre}</span>
        {puedeCopiar && (
          <button
            type="button"
            onClick={onCopiarLaborables}
            className="-m-2 inline-flex min-h-9 items-center p-2 text-xs font-medium text-accent-ink hover:underline"
          >
            Copiar a L–V
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {tramos.length === 0 && !anadiendo && (
          <span className="text-sm text-muted">Sin disponibilidad</span>
        )}
        {tramos.map((t) => (
          <span
            key={t.id}
            className="inline-flex items-center gap-1 rounded-lg bg-accent-soft py-1 pl-2.5 pr-1 text-sm font-medium text-accent-ink"
          >
            {franja(t.hora_inicio, t.hora_fin)}
            <button
              type="button"
              aria-label="Quitar tramo"
              onClick={() => eliminar.mutate(t.id)}
              className="grid size-8 place-items-center rounded-md text-accent-ink/70 hover:bg-surface hover:text-crit"
            >
              <IconoX className="size-3.5" />
            </button>
          </span>
        ))}

        {anadiendo ? (
          <form onSubmit={anadir} className="flex flex-wrap items-center gap-2">
            <Input
              type="time"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              style={{ width: '7rem' }}
            />
            <span className="text-muted">–</span>
            <Input
              type="time"
              value={fin}
              onChange={(e) => setFin(e.target.value)}
              style={{ width: '7rem' }}
            />
            <Boton type="submit" className="px-3 py-1.5" cargando={crear.isPending}>
              Añadir
            </Boton>
            <Boton
              type="button"
              variante="secundario"
              className="px-3 py-1.5"
              onClick={() => {
                setAnadiendo(false)
                setError('')
              }}
            >
              Cancelar
            </Boton>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAnadiendo(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-dashed border-line-strong px-2.5 py-1 text-sm font-medium text-muted hover:text-ink"
          >
            <IconoMas1 className="size-3.5" /> Tramo
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-xs text-crit">
          {error}
        </p>
      )}
    </div>
  )
}

function DiasEspeciales() {
  const { data: excepciones } = useExcepciones()
  const crear = useCrearExcepcion()
  const eliminar = useEliminarExcepcion()

  const [abierto, setAbierto] = useState(false)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [tipo, setTipo] = useState<'bloqueo' | 'extra'>('bloqueo')
  const [todoElDia, setTodoElDia] = useState(true)
  const [inicio, setInicio] = useState('16:00')
  const [fin, setFin] = useState('20:00')
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')
  const [aBorrar, setABorrar] = useState<GrupoExcepcion | null>(null)

  const grupos = agruparExcepciones(excepciones ?? [])

  async function anadir(e: FormEvent) {
    e.preventDefault()
    if (!desde) return
    const fechaHasta = hasta || desde
    if (fechaHasta < desde) {
      setError('"Hasta" debe ser igual o posterior a "Desde".')
      return
    }
    if (!todoElDia && aMinutos(fin) <= aMinutos(inicio)) {
      setError('La hora de fin debe ser posterior.')
      return
    }
    const dias = rangoFechas(desde, fechaHasta)
    if (dias.length > MAX_DIAS_RANGO) {
      setError(`El rango es demasiado largo (máximo ${MAX_DIAS_RANGO} días).`)
      return
    }
    await crear.mutateAsync(
      dias.map((fecha) => ({
        fecha,
        tipo,
        hora_inicio: todoElDia ? null : inicio,
        hora_fin: todoElDia ? null : fin,
        motivo: motivo.trim() || null,
      })),
    )
    setDesde('')
    setHasta('')
    setMotivo('')
    setError('')
    setAbierto(false)
  }

  return (
    <Tarjeta>
      <h2 className="font-display text-base font-semibold text-ink">Días especiales</h2>
      <p className="mt-1 text-sm text-muted">
        Bloqueos puntuales (vacaciones, una semana libre) u horas extra fuera de tu
        semana habitual. Puedes añadir un solo día o un rango de fechas.
      </p>

      {grupos.length ? (
        <ul className="mt-4 flex flex-col divide-y divide-line">
          {grupos.map((g) => (
            <li key={g.ids[0]} className="flex items-center gap-3 py-2.5">
              <span
                className={[
                  'rounded-md px-1.5 py-0.5 text-[11px] font-medium',
                  g.tipo === 'bloqueo'
                    ? 'bg-crit-soft text-crit'
                    : 'bg-good-soft text-good',
                ].join(' ')}
              >
                {g.tipo === 'bloqueo' ? 'Bloqueo' : 'Extra'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">
                  {g.fechaDesde === g.fechaHasta
                    ? fechaCorta(g.fechaDesde)
                    : `${fechaCorta(g.fechaDesde)} – ${fechaCorta(g.fechaHasta)}`}
                </p>
                <p className="truncate text-xs text-muted">
                  {g.hora_inicio ? franja(g.hora_inicio, g.hora_fin!) : 'Todo el día'}
                  {g.motivo ? ` · ${g.motivo}` : ''}
                  {g.ids.length > 1 ? ` · ${g.ids.length} días` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setABorrar(g)}
                className="-m-2 inline-flex min-h-9 items-center p-2 text-xs font-medium text-crit hover:underline"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted">No hay días especiales próximos.</p>
      )}

      <ConfirmarDialogo
        abierto={aBorrar != null}
        titulo={
          aBorrar && aBorrar.ids.length > 1
            ? `¿Quitar estos ${aBorrar.ids.length} días?`
            : '¿Quitar este día especial?'
        }
        texto={
          aBorrar
            ? aBorrar.fechaDesde === aBorrar.fechaHasta
              ? fechaCorta(aBorrar.fechaDesde)
              : `Del ${fechaCorta(aBorrar.fechaDesde)} al ${fechaCorta(aBorrar.fechaHasta)}.`
            : undefined
        }
        confirmar="Quitar"
        peligro
        onCancelar={() => setABorrar(null)}
        onConfirmar={() => {
          if (aBorrar) eliminar.mutate(aBorrar.ids)
          setABorrar(null)
        }}
      />

      {abierto ? (
        <form onSubmit={anadir} className="mt-4 flex flex-col gap-3 rounded-xl bg-surface-2 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-medium text-muted">
              Desde
              <Input
                type="date"
                value={desde}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDesde(e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-muted">
              Hasta (opcional)
              <Input
                type="date"
                value={hasta}
                min={desde || new Date().toISOString().slice(0, 10)}
                onChange={(e) => setHasta(e.target.value)}
                placeholder="Mismo día"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">
            Tipo
            <Select value={tipo} onChange={(e) => setTipo(e.target.value as 'bloqueo' | 'extra')}>
              <option value="bloqueo">Bloqueo</option>
              <option value="extra">Horas extra</option>
            </Select>
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={todoElDia}
              onChange={(e) => setTodoElDia(e.target.checked)}
              className="size-4 rounded border-line-strong"
            />
            Todo el día (todos los días del rango)
          </label>
          {!todoElDia && (
            <div className="flex items-center gap-2">
              <Input type="time" value={inicio} onChange={(e) => setInicio(e.target.value)} style={{ width: '7rem' }} />
              <span className="text-muted">–</span>
              <Input type="time" value={fin} onChange={(e) => setFin(e.target.value)} style={{ width: '7rem' }} />
            </div>
          )}
          <Input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo (opcional)"
          />
          {error && (
            <p role="alert" className="text-xs text-crit">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Boton type="submit" cargando={crear.isPending}>Guardar</Boton>
            <Boton type="button" variante="secundario" onClick={() => setAbierto(false)}>
              Cancelar
            </Boton>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-ink hover:underline"
        >
          <IconoMas1 className="size-4" /> Añadir día especial
        </button>
      )}
    </Tarjeta>
  )
}

export function PaginaDisponibilidad() {
  const { data: tramos, isLoading } = useDisponibilidad()
  const reemplazar = useReemplazarDia()

  const porDia = (d: number) => tramos?.filter((t) => t.dia_semana === d) ?? []

  const copiarLaborables = (origen: number) => {
    const fuente = porDia(origen).map((t) => ({
      hora_inicio: t.hora_inicio,
      hora_fin: t.hora_fin,
    }))
    for (let d = 1; d <= 5; d++) {
      if (d !== origen) reemplazar.mutate({ dia: d, tramos: fuente })
    }
  }

  return (
    <>
      <Link
        to="/mas"
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
      >
        <IconoFlechaIzq className="size-4" /> Más
      </Link>
      <CabeceraPagina
        titulo="Disponibilidad"
        subtitulo="Tus horas de trabajo. La agenda avisará si creas una clase fuera de ellas."
      />

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-surface-2" />
      ) : (
        <div className="flex flex-col gap-4">
          <DiasEspeciales />

          <Tarjeta>
            <h2 className="font-display text-base font-semibold text-ink">Semana habitual</h2>
            <p className="mt-1 text-sm text-muted">De lunes a viernes.</p>
            <div className="mt-2">
              {DIAS_SEMANA.slice(0, 5).map((nombre, i) => {
                const dia = i + 1
                return (
                  <FilaDia
                    key={dia}
                    dia={dia}
                    nombre={nombre}
                    tramos={porDia(dia)}
                    puedeCopiar={porDia(dia).length > 0}
                    onCopiarLaborables={() => copiarLaborables(dia)}
                  />
                )
              })}
            </div>
          </Tarjeta>
        </div>
      )}
    </>
  )
}
