import { aMinutos } from '@/lib/fechas'
import type { ClaseAgenda } from './api'

export interface RejillaConfig {
  /** Minuto del día en que empieza la rejilla (múltiplo de 60). */
  desdeMin: number
  /** Minuto del día en que acaba la rejilla. */
  hastaMin: number
  /** Altura en píxeles de una hora. */
  pxHora: number
}

const H = 60

/** Calcula el rango de horas a mostrar a partir de las clases (y un mínimo por defecto). */
export function calcularRejilla(
  clases: Pick<ClaseAgenda, 'hora_inicio' | 'hora_fin'>[],
  pxHora: number,
  porDefecto: [number, number] = [9, 21],
): RejillaConfig {
  let min = porDefecto[0] * H
  let max = porDefecto[1] * H
  for (const c of clases) {
    min = Math.min(min, Math.floor(aMinutos(c.hora_inicio) / H) * H)
    max = Math.max(max, Math.ceil(aMinutos(c.hora_fin) / H) * H)
  }
  return { desdeMin: min, hastaMin: max, pxHora }
}

export function altoRejilla(cfg: RejillaConfig): number {
  return ((cfg.hastaMin - cfg.desdeMin) / H) * cfg.pxHora
}

export function horasDe(cfg: RejillaConfig): number[] {
  const horas: number[] = []
  for (let m = cfg.desdeMin; m < cfg.hastaMin; m += H) horas.push(m / H)
  return horas
}

/** Posición vertical de un bloque dentro de la rejilla. */
export function posicion(
  horaInicio: string,
  horaFin: string,
  cfg: RejillaConfig,
): { top: number; alto: number } {
  const i = aMinutos(horaInicio)
  const f = aMinutos(horaFin)
  return {
    top: ((i - cfg.desdeMin) / H) * cfg.pxHora,
    alto: Math.max(((f - i) / H) * cfg.pxHora, 22),
  }
}

/** Minutos desde medianoche hasta "ahora". */
export function ahoraMin(): number {
  const d = new Date()
  return d.getHours() * H + d.getMinutes()
}

/**
 * Reparte en carriles las clases que se solapan en el tiempo (para poder
 * mostrarlas una al lado de otra). Devuelve, por clase, su carril y el total.
 */
export function carriles<T extends { hora_inicio: string; hora_fin: string }>(
  clases: T[],
): Map<T, { carril: number; total: number }> {
  const orden = [...clases].sort(
    (a, b) => aMinutos(a.hora_inicio) - aMinutos(b.hora_inicio),
  )
  const res = new Map<T, { carril: number; total: number }>()
  let grupo: T[] = []
  let finGrupo = -1

  const cerrar = () => {
    grupo.forEach((c, i) => res.set(c, { carril: i, total: grupo.length }))
    grupo = []
    finGrupo = -1
  }

  for (const c of orden) {
    const i = aMinutos(c.hora_inicio)
    if (grupo.length && i >= finGrupo) cerrar()
    grupo.push(c)
    finGrupo = Math.max(finGrupo, aMinutos(c.hora_fin))
  }
  cerrar()
  return res
}
