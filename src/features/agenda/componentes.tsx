import { hora, franja } from '@/lib/fechas'
import type { ClaseAgenda } from './api'
import { ESTADO } from './estado'
import {
  posicion,
  carriles,
  horasDe,
  altoRejilla,
  ahoraMin,
  type RejillaConfig,
} from './rejilla'

/** hex + alpha (00–ff). */
function tinte(hex: string, alpha: string) {
  return `${hex}${alpha}`
}

export function BloqueClase({
  clase,
  cfg,
  carril = 0,
  total = 1,
  onClick,
}: {
  clase: ClaseAgenda
  cfg: RejillaConfig
  carril?: number
  total?: number
  onClick: (id: string) => void
}) {
  const { top, alto } = posicion(clase.hora_inicio, clase.hora_fin, cfg)
  const cancelada = clase.estado === 'cancelada'
  const anchoPct = 100 / total
  const compacto = alto < 42

  return (
    <button
      type="button"
      onClick={() => onClick(clase.id)}
      className="absolute overflow-hidden rounded-lg border border-line/50 px-2 py-1 text-left transition-[filter] hover:brightness-[0.97] focus-visible:z-10"
      style={{
        top,
        height: alto - 2,
        left: `calc(${carril * anchoPct}% + 2px)`,
        width: `calc(${anchoPct}% - 4px)`,
        background: tinte(clase.alumno.color, cancelada ? '18' : '2b'),
        borderLeft: `3px solid ${clase.alumno.color}`,
        opacity: cancelada ? 0.6 : 1,
      }}
    >
      <p
        className={`truncate text-[12px] font-semibold leading-tight text-ink ${
          cancelada ? 'line-through' : ''
        }`}
      >
        {clase.alumno.nombre}
      </p>
      {!compacto && (
        <p className="truncate text-[11px] leading-tight text-muted">
          {clase.materia?.nombre ?? 'Sin materia'}
        </p>
      )}
      {!compacto && alto > 58 && (
        <p className="mt-0.5 font-mono text-[11px] text-muted">
          {franja(clase.hora_inicio, clase.hora_fin)}
        </p>
      )}
    </button>
  )
}

export function EjeHoras({ cfg }: { cfg: RejillaConfig }) {
  return (
    <div className="relative w-12 shrink-0" style={{ height: altoRejilla(cfg) }}>
      {horasDe(cfg).map((h, i) => (
        <div
          key={h}
          className={`absolute right-2 font-mono text-[11px] text-muted ${
            i === 0 ? '' : '-translate-y-1/2'
          }`}
          style={{ top: i * cfg.pxHora }}
        >
          {`${String(h).padStart(2, '0')}:00`}
        </div>
      ))}
    </div>
  )
}

export function ColumnaDia({
  clases,
  cfg,
  esHoy = false,
  onClickClase,
}: {
  clases: ClaseAgenda[]
  cfg: RejillaConfig
  esHoy?: boolean
  onClickClase: (id: string) => void
}) {
  const lanes = carriles(clases)
  const ahora = ahoraMin()
  const mostrarAhora =
    esHoy && ahora >= cfg.desdeMin && ahora <= cfg.hastaMin

  return (
    <div
      className="relative flex-1 border-l border-line"
      style={{ height: altoRejilla(cfg) }}
    >
      {horasDe(cfg).map((_h, i) => (
        <div
          key={i}
          className="absolute inset-x-0 border-t border-line/60"
          style={{ top: i * cfg.pxHora }}
        />
      ))}

      {clases.map((c) => {
        const l = lanes.get(c) ?? { carril: 0, total: 1 }
        return (
          <BloqueClase
            key={c.id}
            clase={c}
            cfg={cfg}
            carril={l.carril}
            total={l.total}
            onClick={onClickClase}
          />
        )
      })}

      {mostrarAhora && (
        <div
          className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-crit"
          style={{ top: ((ahora - cfg.desdeMin) / 60) * cfg.pxHora }}
        >
          <span className="absolute -left-1 -top-1 size-2 rounded-full bg-crit" />
        </div>
      )}
    </div>
  )
}

export function PillEstado({ estado }: { estado: ClaseAgenda['estado'] }) {
  const e = ESTADO[estado]
  return (
    <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${e.pill}`}>
      {e.etiqueta}
    </span>
  )
}

/** Fila de clase para listas (vista mes, día de un mes, resultados de filtro). */
export function FilaClase({
  clase,
  onClick,
}: {
  clase: ClaseAgenda
  onClick: (id: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(clase.id)}
      className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
    >
      <span
        className="h-9 w-1 shrink-0 rounded-full"
        style={{ backgroundColor: clase.alumno.color }}
      />
      <div className="w-14 shrink-0 font-mono text-xs text-muted">
        {hora(clase.hora_inicio)}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-semibold text-ink ${
            clase.estado === 'cancelada' ? 'line-through' : ''
          }`}
        >
          {clase.alumno.nombre} {clase.alumno.apellidos ?? ''}
        </p>
        <p className="truncate text-xs text-muted">
          {clase.materia?.nombre ?? 'Sin materia'} · {franja(clase.hora_inicio, clase.hora_fin)}
        </p>
      </div>
      {clase.estado !== 'programada' && <PillEstado estado={clase.estado} />}
    </button>
  )
}
