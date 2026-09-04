import { useState } from 'react'
import { Modal, Boton } from '@/components/ui'
import { Input, Select, Textarea, InputFecha } from '@/components/campos'
import {
  DURACIONES,
  duracionLegible,
  hora,
  sumarMinutos,
  aMinutos,
  diaSemanaISO,
  deISO,
} from '@/lib/fechas'
import { useActualizarHorario } from '@/features/horarios/api'
import {
  useCancelarClase,
  useMoverClase,
  useRecuperarClase,
  mensajeErrorClase,
  type ClaseDetalle,
} from './api'

function ScopeSerie({
  valor,
  onChange,
}: {
  valor: 'esta' | 'serie'
  onChange: (v: 'esta' | 'serie') => void
}) {
  return (
    <fieldset className="flex flex-col gap-2 rounded-xl bg-surface-2 p-3">
      <legend className="px-1 text-xs font-medium text-muted">Esta clase forma parte de un horario habitual</legend>
      {(
        [
          ['esta', 'Solo esta clase'],
          ['serie', 'Todas las de este horario'],
        ] as const
      ).map(([v, txt]) => (
        <label key={v} className="flex items-center gap-2 text-sm text-ink">
          <input
            type="radio"
            name="scope"
            checked={valor === v}
            onChange={() => onChange(v)}
            className="size-4"
          />
          {txt}
        </label>
      ))}
    </fieldset>
  )
}

export function CancelarDialogo({
  clase,
  abierto,
  onCerrar,
  onHecho,
}: {
  clase: ClaseDetalle
  abierto: boolean
  onCerrar: () => void
  onHecho: () => void
}) {
  const cancelar = useCancelarClase()
  const desactivarHorario = useActualizarHorario(clase.alumno_id)
  const [motivo, setMotivo] = useState('')
  const [pendiente, setPendiente] = useState(false)
  const [scope, setScope] = useState<'esta' | 'serie'>('esta')
  const [error, setError] = useState('')

  const recurrente = !!clase.horario_recurrente

  async function confirmar() {
    setError('')
    try {
      if (recurrente && scope === 'serie') {
        await desactivarHorario.mutateAsync({
          id: clase.horario_recurrente!.id,
          cambios: { activo: false },
        })
      } else {
        await cancelar.mutateAsync({
          id: clase.id,
          motivo: motivo.trim() || undefined,
          pendienteRecuperar: pendiente,
        })
      }
      onHecho()
    } catch (e) {
      setError(mensajeErrorClase(e))
    }
  }

  return (
    <Modal abierto={abierto} titulo="Cancelar clase" onCerrar={onCerrar}>
      <div className="flex flex-col gap-3">
        {recurrente && <ScopeSerie valor={scope} onChange={setScope} />}

        {(!recurrente || scope === 'esta') && (
          <>
            <label className="flex flex-col gap-1 text-xs font-medium text-muted">
              Motivo (opcional)
              <Textarea
                rows={2}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="El alumno está malo, viaje…"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={pendiente}
                onChange={(e) => setPendiente(e.target.checked)}
                className="size-4 rounded border-line-strong"
              />
              Dejar pendiente de recuperar
            </label>
          </>
        )}

        {recurrente && scope === 'serie' && (
          <p className="rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">
            Se pausará el horario y se quitarán las clases futuras. Las pasadas se
            conservan. Puedes reanudarlo desde la ficha del alumno.
          </p>
        )}

        {error && <p role="alert" className="text-sm text-crit">{error}</p>}

        <div className="mt-1 flex gap-2">
          <Boton variante="secundario" className="flex-1" onClick={onCerrar}>
            Volver
          </Boton>
          <Boton
            variante="peligro"
            className="flex-1"
            onClick={confirmar}
            cargando={cancelar.isPending || desactivarHorario.isPending}
          >
            {recurrente && scope === 'serie' ? 'Pausar horario' : 'Cancelar clase'}
          </Boton>
        </div>
      </div>
    </Modal>
  )
}

export function MoverDialogo({
  clase,
  abierto,
  onCerrar,
  onHecho,
}: {
  clase: ClaseDetalle
  abierto: boolean
  onCerrar: () => void
  onHecho: () => void
}) {
  const mover = useMoverClase()
  const actualizarHorario = useActualizarHorario(clase.alumno_id)
  const durActual = aMinutos(clase.hora_fin) - aMinutos(clase.hora_inicio)

  const [fecha, setFecha] = useState(clase.fecha)
  const [horaInicio, setHoraInicio] = useState(hora(clase.hora_inicio))
  const [duracion, setDuracion] = useState(durActual)
  const [motivo, setMotivo] = useState('')
  const [scope, setScope] = useState<'esta' | 'serie'>('esta')
  const [error, setError] = useState('')

  const recurrente = !!clase.horario_recurrente

  async function confirmar() {
    setError('')
    const horaFin = sumarMinutos(horaInicio, duracion)
    try {
      if (recurrente && scope === 'serie') {
        await actualizarHorario.mutateAsync({
          id: clase.horario_recurrente!.id,
          cambios: {
            dia_semana: diaSemanaISO(deISO(fecha)),
            hora_inicio: horaInicio,
            duracion_min: duracion,
          },
        })
      } else {
        await mover.mutateAsync({
          id: clase.id,
          fecha,
          horaInicio,
          horaFin,
          motivo: motivo.trim() || undefined,
        })
      }
      onHecho()
    } catch (e) {
      setError(mensajeErrorClase(e))
    }
  }

  return (
    <Modal abierto={abierto} titulo="Cambiar horario" onCerrar={onCerrar}>
      <div className="flex flex-col gap-3">
        {recurrente && <ScopeSerie valor={scope} onChange={setScope} />}

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">
            Fecha
            <InputFecha value={fecha} onChange={setFecha} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">
            Hora
            <Input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Duración
          <Select value={duracion} onChange={(e) => setDuracion(Number(e.target.value))}>
            {DURACIONES.map((d) => (
              <option key={d} value={d}>
                {duracionLegible(d)}
              </option>
            ))}
          </Select>
        </label>

        {recurrente && scope === 'serie' ? (
          <p className="rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">
            Cambia el horario habitual: se reajustan todas las clases futuras no
            modificadas. La fecha elegida solo marca el día de la semana.
          </p>
        ) : (
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">
            Motivo (opcional)
            <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </label>
        )}

        {error && <p role="alert" className="text-sm text-crit">{error}</p>}

        <div className="mt-1 flex gap-2">
          <Boton variante="secundario" className="flex-1" onClick={onCerrar}>
            Volver
          </Boton>
          <Boton
            className="flex-1"
            onClick={confirmar}
            cargando={mover.isPending || actualizarHorario.isPending}
          >
            Guardar
          </Boton>
        </div>
      </div>
    </Modal>
  )
}

export function RecuperarDialogo({
  clase,
  abierto,
  onCerrar,
  onCreada,
}: {
  clase: ClaseDetalle
  abierto: boolean
  onCerrar: () => void
  onCreada: (nuevaId: string) => void
}) {
  const recuperar = useRecuperarClase()
  const durActual = aMinutos(clase.hora_fin) - aMinutos(clase.hora_inicio)

  const [fecha, setFecha] = useState('')
  const [horaInicio, setHoraInicio] = useState(hora(clase.hora_inicio))
  const [duracion, setDuracion] = useState(durActual)
  const [error, setError] = useState('')

  async function confirmar() {
    if (!fecha) {
      setError('Elige una fecha para la recuperación.')
      return
    }
    setError('')
    try {
      const nueva = await recuperar.mutateAsync({
        id: clase.id,
        fecha,
        horaInicio,
        horaFin: sumarMinutos(horaInicio, duracion),
      })
      onCreada(nueva)
    } catch (e) {
      setError(mensajeErrorClase(e))
    }
  }

  return (
    <Modal abierto={abierto} titulo="Recuperar clase" onCerrar={onCerrar}>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted">
          Se crea una clase nueva de {clase.alumno.nombre}
          {clase.materia ? ` (${clase.materia.nombre})` : ''} enlazada a esta.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">
            Fecha
            <InputFecha
              value={fecha}
              min={new Date().toISOString().slice(0, 10)}
              onChange={setFecha}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">
            Hora
            <Input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Duración
          <Select value={duracion} onChange={(e) => setDuracion(Number(e.target.value))}>
            {DURACIONES.map((d) => (
              <option key={d} value={d}>
                {duracionLegible(d)}
              </option>
            ))}
          </Select>
        </label>

        {error && <p role="alert" className="text-sm text-crit">{error}</p>}

        <div className="mt-1 flex gap-2">
          <Boton variante="secundario" className="flex-1" onClick={onCerrar}>
            Volver
          </Boton>
          <Boton className="flex-1" onClick={confirmar} cargando={recuperar.isPending}>
            Crear recuperación
          </Boton>
        </div>
      </div>
    </Modal>
  )
}
