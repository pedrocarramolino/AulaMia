import { addDays, differenceInCalendarDays } from 'date-fns'
import { aISO, deISO } from '@/lib/fechas'

export interface ClaseDisponible {
  id: string
  fecha: string
}

export interface PasoGenerado {
  fecha: string
  descripcion: string
  orden: number
  clase_id: string | null
}

/**
 * Reparte el temario de un examen en pasos de repaso entre hoy y la víspera.
 * Prioriza las clases ya programadas con ese alumno; si no hay, usa fechas sueltas.
 */
export function generarPasosRepaso(
  temario: string | null,
  fechaExamen: string,
  clases: ClaseDisponible[],
): PasoGenerado[] {
  const temas = (temario ?? '')
    .split(/[\n;,]+/)
    .map((t) => t.trim())
    .filter(Boolean)

  const pasos: string[] = [
    ...temas.map((t) => `Repaso: ${t}`),
    'Sesión de ejercicios',
    'Simulacro de examen',
    'Repaso final',
  ]

  const hoyISO = aISO(new Date())
  const slots = clases
    .filter((c) => c.fecha > hoyISO && c.fecha < fechaExamen)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  const salida: PasoGenerado[] = []

  if (slots.length >= pasos.length && pasos.length > 0) {
    for (let i = 0; i < pasos.length; i++) {
      const idx =
        pasos.length === 1
          ? slots.length - 1
          : Math.round((i * (slots.length - 1)) / (pasos.length - 1))
      salida.push({
        fecha: slots[idx].fecha,
        descripcion: pasos[i],
        orden: i,
        clase_id: slots[idx].id,
      })
    }
  } else if (slots.length > 0) {
    for (let i = 0; i < pasos.length; i++) {
      const idx = Math.min(Math.floor((i * slots.length) / pasos.length), slots.length - 1)
      salida.push({
        fecha: slots[idx].fecha,
        descripcion: pasos[i],
        orden: i,
        clase_id: slots[idx].id,
      })
    }
  } else {
    const vispera = addDays(deISO(fechaExamen), -1)
    const dias = Math.max(differenceInCalendarDays(vispera, new Date()), 1)
    for (let i = 0; i < pasos.length; i++) {
      const offset = Math.max(1, Math.round(((i + 1) * dias) / (pasos.length + 1)))
      salida.push({
        fecha: aISO(addDays(new Date(), offset)),
        descripcion: pasos[i],
        orden: i,
        clase_id: null,
      })
    }
  }

  return salida
}
