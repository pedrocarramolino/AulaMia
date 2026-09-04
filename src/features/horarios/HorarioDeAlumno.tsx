import { useState, type FormEvent } from 'react'
import { Boton, ConfirmarDialogo } from '@/components/ui'
import { Input, Select, InputFecha } from '@/components/campos'
import { IconoMas1, IconoAgenda } from '@/components/iconos'
import {
  DIAS_SEMANA,
  DIAS_ABREV,
  DURACIONES,
  duracionLegible,
  franja,
  sumarMinutos,
  hora,
  fechaCorta,
} from '@/lib/fechas'
import { useMateriasDeAlumno } from '@/features/alumnos/api'
import {
  useHorariosDeAlumno,
  useCrearHorario,
  useActualizarHorario,
  useEliminarHorario,
  type Horario,
} from './api'

interface Campos {
  dias: number[]
  hora_inicio: string
  duracion_min: number
  materia_id: string
  vigente_desde: string
  vigente_hasta: string
  precio: string
}

const hoyISO = () => new Date().toISOString().slice(0, 10)

function camposVacios(): Campos {
  return {
    dias: [1],
    hora_inicio: '17:00',
    duracion_min: 60,
    materia_id: '',
    vigente_desde: hoyISO(),
    vigente_hasta: '',
    precio: '',
  }
}

/** Un payload de horario_recurrente por cada día seleccionado. */
function aPayloads(c: Campos, alumnoId: string) {
  const base = {
    alumno_id: alumnoId,
    hora_inicio: c.hora_inicio,
    duracion_min: c.duracion_min,
    materia_id: c.materia_id || null,
    vigente_desde: c.vigente_desde || hoyISO(),
    vigente_hasta: c.vigente_hasta || null,
    precio: c.precio ? Number(c.precio) : null,
  }
  return c.dias.map((d) => ({ ...base, dia_semana: d }))
}

function SelectorDias({
  valor,
  onChange,
  multiple,
}: {
  valor: number[]
  onChange: (d: number[]) => void
  multiple: boolean
}) {
  const alternar = (d: number) => {
    if (!multiple) {
      onChange([d])
      return
    }
    onChange(valor.includes(d) ? valor.filter((x) => x !== d) : [...valor, d].sort((a, b) => a - b))
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {DIAS_ABREV.map((abrev, i) => {
        const dia = i + 1
        const activo = valor.includes(dia)
        return (
          <button
            key={dia}
            type="button"
            aria-pressed={activo}
            aria-label={DIAS_SEMANA[i]}
            onClick={() => alternar(dia)}
            className={`size-9 rounded-lg text-sm font-semibold transition-colors ${
              activo
                ? 'bg-accent text-white'
                : 'border border-line-strong text-muted hover:bg-surface'
            }`}
          >
            {abrev}
          </button>
        )
      })}
    </div>
  )
}

function FormularioHorario({
  alumnoId,
  inicial,
  onGuardar,
  onCancelar,
  guardando,
  etiquetaGuardar,
  modo,
}: {
  alumnoId: string
  inicial: Campos
  onGuardar: (c: Campos) => void
  onCancelar: () => void
  guardando: boolean
  etiquetaGuardar: string
  modo: 'crear' | 'editar'
}) {
  const { data: materias } = useMateriasDeAlumno(alumnoId)
  const [c, setC] = useState<Campos>(inicial)
  const [error, setError] = useState('')
  const set = <K extends keyof Campos>(k: K, v: Campos[K]) => setC((p) => ({ ...p, [k]: v }))

  function enviar(e: FormEvent) {
    e.preventDefault()
    if (c.dias.length === 0) {
      setError('Elige al menos un día.')
      return
    }
    setError('')
    onGuardar(c)
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface-2 p-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted">
          {modo === 'crear' ? 'Días (uno o varios)' : 'Día'}
        </span>
        <SelectorDias
          valor={c.dias}
          onChange={(d) => set('dias', d)}
          multiple={modo === 'crear'}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Hora de inicio
          <Input type="time" value={c.hora_inicio} onChange={(e) => set('hora_inicio', e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Duración
          <Select value={c.duracion_min} onChange={(e) => set('duracion_min', Number(e.target.value))}>
            {DURACIONES.map((d) => (
              <option key={d} value={d}>
                {duracionLegible(d)}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Materia
          <Select value={c.materia_id} onChange={(e) => set('materia_id', e.target.value)}>
            <option value="">Sin materia fija</option>
            {materias?.map((m) => (
              <option key={m.materia_id} value={m.materia_id}>
                {m.materia.nombre}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Desde
          <InputFecha value={c.vigente_desde} onChange={(v) => set('vigente_desde', v)} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Hasta (opcional)
          <InputFecha
            value={c.vigente_hasta}
            min={c.vigente_desde}
            onChange={(v) => set('vigente_hasta', v)}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Precio de esta clase (€, opcional)
          <Input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.5"
            value={c.precio}
            onChange={(e) => set('precio', e.target.value)}
            placeholder="Según el alumno"
          />
        </label>
      </div>

      {error && <p role="alert" className="text-xs text-crit">{error}</p>}

      <div className="flex gap-2">
        <Boton type="submit" disabled={guardando}>
          {guardando ? 'Guardando…' : etiquetaGuardar}
        </Boton>
        <Boton type="button" variante="secundario" onClick={onCancelar}>
          Cancelar
        </Boton>
      </div>
    </form>
  )
}

function FilaHorario({ alumnoId, horario }: { alumnoId: string; horario: Horario }) {
  const actualizar = useActualizarHorario(alumnoId)
  const eliminar = useEliminarHorario(alumnoId)
  const [editando, setEditando] = useState(false)
  const [confirmar, setConfirmar] = useState(false)

  const finTexto = sumarMinutos(hora(horario.hora_inicio), horario.duracion_min)

  if (editando) {
    return (
      <FormularioHorario
        alumnoId={alumnoId}
        modo="editar"
        guardando={actualizar.isPending}
        etiquetaGuardar="Guardar cambios"
        inicial={{
          dias: [horario.dia_semana],
          hora_inicio: hora(horario.hora_inicio),
          duracion_min: horario.duracion_min,
          materia_id: horario.materia_id ?? '',
          vigente_desde: horario.vigente_desde,
          vigente_hasta: horario.vigente_hasta ?? '',
          precio: horario.precio?.toString() ?? '',
        }}
        onCancelar={() => setEditando(false)}
        onGuardar={async (c) => {
          const [p] = aPayloads(c, alumnoId)
          const { alumno_id: _a, ...cambios } = p
          await actualizar.mutateAsync({ id: horario.id, cambios })
          setEditando(false)
        }}
      />
    )
  }

  return (
    <div
      className={[
        'rounded-2xl border border-line bg-surface p-4',
        horario.activo ? '' : 'opacity-60',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-ink">
            {DIAS_SEMANA[horario.dia_semana - 1]} · {franja(hora(horario.hora_inicio), finTexto)}
          </p>
          <p className="mt-0.5 text-sm text-muted">
            {duracionLegible(horario.duracion_min)}
            {horario.materia ? ` · ${horario.materia.nombre}` : ' · sin materia fija'}
          </p>
          {(horario.vigente_hasta || horario.vigente_desde > hoyISO()) && (
            <p className="mt-1 text-xs text-muted">
              {horario.vigente_desde > hoyISO() && `Desde ${fechaCorta(horario.vigente_desde)}`}
              {horario.vigente_desde > hoyISO() && horario.vigente_hasta && ' · '}
              {horario.vigente_hasta && `Hasta ${fechaCorta(horario.vigente_hasta)}`}
            </p>
          )}
          {!horario.activo && (
            <span className="mt-1.5 inline-block rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-muted">
              Pausado
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-accent-ink hover:bg-accent-soft"
        >
          Editar
        </button>
      </div>

      <div className="mt-3 flex gap-4 border-t border-line pt-2.5 text-xs font-medium">
        <button
          type="button"
          onClick={() => actualizar.mutate({ id: horario.id, cambios: { activo: !horario.activo } })}
          className="-my-1.5 inline-flex min-h-9 items-center py-1.5 text-muted hover:text-ink"
        >
          {horario.activo ? 'Pausar' : 'Reanudar'}
        </button>
        <button
          type="button"
          onClick={() => setConfirmar(true)}
          className="-my-1.5 inline-flex min-h-9 items-center py-1.5 text-crit hover:underline"
        >
          Eliminar
        </button>
      </div>

      <ConfirmarDialogo
        abierto={confirmar}
        titulo="¿Eliminar este horario?"
        texto="Se quitarán las clases futuras aún no modificadas de esta serie. Las clases pasadas y las que hayas tocado a mano se conservan."
        confirmar="Eliminar"
        peligro
        onCancelar={() => setConfirmar(false)}
        onConfirmar={() => {
          eliminar.mutate(horario.id)
          setConfirmar(false)
        }}
      />
    </div>
  )
}

export function HorarioDeAlumno({ alumnoId }: { alumnoId: string }) {
  const { data: horarios, isLoading } = useHorariosDeAlumno(alumnoId)
  const crear = useCrearHorario(alumnoId)
  const [anadiendo, setAnadiendo] = useState(false)

  if (isLoading) return <div className="h-24 animate-pulse rounded-2xl bg-surface-2" />

  return (
    <div className="flex flex-col gap-3">
      {horarios?.length ? (
        horarios.map((h) => <FilaHorario key={h.id} alumnoId={alumnoId} horario={h} />)
      ) : (
        !anadiendo && (
          <div className="rounded-2xl border border-dashed border-line-strong bg-surface px-5 py-8 text-center">
            <IconoAgenda className="mx-auto size-7 text-muted" />
            <p className="mt-2 text-sm text-muted">
              Sin horario habitual. Al añadir uno, la app genera solas las clases de
              las próximas 8 semanas.
            </p>
          </div>
        )
      )}

      {anadiendo ? (
        <FormularioHorario
          alumnoId={alumnoId}
          modo="crear"
          guardando={crear.isPending}
          etiquetaGuardar="Añadir horario"
          inicial={camposVacios()}
          onCancelar={() => setAnadiendo(false)}
          onGuardar={async (c) => {
            await crear.mutateAsync(aPayloads(c, alumnoId))
            setAnadiendo(false)
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAnadiendo(true)}
          className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong py-3 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-soft"
        >
          <IconoMas1 className="size-4" /> Añadir horario
        </button>
      )}
    </div>
  )
}
