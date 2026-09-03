import { addDays } from 'date-fns'
import { aISO, aMinutos, deMinutos, diaSemanaISO, diasRestantes } from '@/lib/fechas'
import type { AlumnoConMaterias } from '@/features/alumnos/api'
import type { ClaseAgenda } from '@/features/agenda/api'
import type { Examen } from '@/features/examenes/api'
import type { Tramo, Excepcion } from '@/features/disponibilidad/api'

export interface Sugerencia {
  clave: string
  alumnoId: string
  alumnoNombre: string
  alumnoColor: string
  materiaId: string
  materiaNombre: string
  fecha: string
  horaInicio: string
  horaFin: string
  motivo: string
  score: number
}

interface Necesidad {
  alumno: AlumnoConMaterias
  materiaId: string
  materiaNombre: string
  score: number
  motivo: string
  examenFecha: string | null
  urgente: boolean
}

const DURACION = 60
const HORIZONTE = 10
const UMBRAL = 8

function ultimaRealizada(clases: ClaseAgenda[], alumnoId: string, materiaId: string): string | null {
  const f = clases
    .filter(
      (c) => c.alumno_id === alumnoId && c.materia_id === materiaId && c.estado === 'realizada',
    )
    .map((c) => c.fecha)
    .sort()
  return f.at(-1) ?? null
}

function construirNecesidades(
  alumnos: AlumnoConMaterias[],
  examenes: Examen[],
  clases: ClaseAgenda[],
): Necesidad[] {
  const hoy = new Date()
  const out: Necesidad[] = []

  for (const alumno of alumnos) {
    for (const am of alumno.alumno_materia) {
      const materiaId = am.materia.id
      const ultima = ultimaRealizada(clases, alumno.id, materiaId)
      const diasSin = ultima
        ? Math.round((hoy.getTime() - new Date(ultima).getTime()) / 86400000)
        : 45

      const examen = examenes
        .filter(
          (e) =>
            e.alumno_id === alumno.id &&
            (e.materia_id === materiaId || e.materia_id === null) &&
            diasRestantes(e.fecha) >= 0,
        )
        .sort((a, b) => a.fecha.localeCompare(b.fecha))[0]
      const dExamen = examen ? diasRestantes(examen.fecha) : null
      const nivelPrep = examen?.nivel_preparacion ?? 3

      let score = 0
      const factores: { peso: number; txt: string }[] = []

      if (dExamen !== null && dExamen <= 21) {
        const p = (22 - dExamen) * 4
        score += p
        factores.push({ peso: p, txt: `Examen en ${dExamen} ${dExamen === 1 ? 'día' : 'días'}` })
        if (nivelPrep <= 3) {
          score += (5 - nivelPrep) * 3
          factores.push({ peso: (5 - nivelPrep) * 3, txt: 'poco preparado' })
        }
      }

      const pSin = Math.min(diasSin, 45) * 0.8
      score += pSin
      if (diasSin >= 10) {
        factores.push({ peso: pSin, txt: `sin repasar hace ${diasSin} días` })
      }

      if (alumno.prioridad === 3) {
        score += 6
        factores.push({ peso: 6, txt: 'alumno prioritario' })
      }
      if (am.prioridad === 3) {
        score += 4
        factores.push({ peso: 4, txt: 'materia prioritaria' })
      }

      if (score < UMBRAL) continue

      const motivo =
        factores.sort((a, b) => b.peso - a.peso).slice(0, 2).map((f) => f.txt).join(' · ') ||
        'Repaso recomendado'

      out.push({
        alumno,
        materiaId,
        materiaNombre: am.materia.nombre,
        score,
        motivo: motivo.charAt(0).toUpperCase() + motivo.slice(1),
        examenFecha: examen?.fecha ?? null,
        urgente: dExamen !== null && dExamen <= 7,
      })
    }
  }

  return out.sort((a, b) => b.score - a.score)
}

interface Hueco {
  fecha: string
  inicioMin: number
}

function huecosLibres(
  disponibilidad: Tramo[],
  excepciones: Excepcion[],
  clases: ClaseAgenda[],
): Hueco[] {
  const huecos: Hueco[] = []
  const hoy = new Date()

  for (let i = 1; i <= HORIZONTE; i++) {
    const dia = addDays(hoy, i)
    const fecha = aISO(dia)
    const dow = diaSemanaISO(dia)

    const tramos = disponibilidad.filter((t) => t.dia_semana === dow)
    if (!tramos.length) continue

    const bloqueoTotal = excepciones.some(
      (e) => e.fecha === fecha && e.tipo === 'bloqueo' && !e.hora_inicio,
    )
    if (bloqueoTotal) continue

    const ocupados: [number, number][] = [
      ...clases
        .filter((c) => c.fecha === fecha && c.estado !== 'cancelada')
        .map((c) => [aMinutos(c.hora_inicio), aMinutos(c.hora_fin)] as [number, number]),
      ...excepciones
        .filter((e) => e.fecha === fecha && e.tipo === 'bloqueo' && e.hora_inicio)
        .map((e) => [aMinutos(e.hora_inicio!), aMinutos(e.hora_fin!)] as [number, number]),
    ]

    for (const t of tramos) {
      let cursor = aMinutos(t.hora_inicio)
      const fin = aMinutos(t.hora_fin)
      let puestos = 0
      while (cursor + DURACION <= fin && puestos < 2) {
        const solapa = ocupados.some(([a, b]) => cursor < b && cursor + DURACION > a)
        if (solapa) {
          cursor += 30
        } else {
          huecos.push({ fecha, inicioMin: cursor })
          cursor += DURACION
          puestos++
        }
      }
    }
  }

  return huecos.sort((a, b) =>
    a.fecha === b.fecha ? a.inicioMin - b.inicioMin : a.fecha.localeCompare(b.fecha),
  )
}

export function sugerirRepasos(datos: {
  alumnos: AlumnoConMaterias[]
  examenes: Examen[]
  clases: ClaseAgenda[]
  disponibilidad: Tramo[]
  excepciones: Excepcion[]
}): Sugerencia[] {
  const necesidades = construirNecesidades(datos.alumnos, datos.examenes, datos.clases)
  const huecos = huecosLibres(datos.disponibilidad, datos.excepciones, datos.clases)

  const usados = new Set<number>()
  const conteo = new Map<string, number>()
  const sugerencias: Sugerencia[] = []

  for (let pase = 0; pase < 3; pase++) {
    for (const n of necesidades) {
      const clave = `${n.alumno.id}:${n.materiaId}`
      const max = n.urgente ? 3 : 2
      if ((conteo.get(clave) ?? 0) >= max) continue

      const idx = huecos.findIndex((h, i) => {
        if (usados.has(i)) return false
        if (n.examenFecha && h.fecha >= n.examenFecha) return false
        return true
      })
      if (idx === -1) continue

      usados.add(idx)
      conteo.set(clave, (conteo.get(clave) ?? 0) + 1)
      const h = huecos[idx]
      sugerencias.push({
        clave: `${clave}:${h.fecha}:${h.inicioMin}`,
        alumnoId: n.alumno.id,
        alumnoNombre: n.alumno.nombre,
        alumnoColor: n.alumno.color,
        materiaId: n.materiaId,
        materiaNombre: n.materiaNombre,
        fecha: h.fecha,
        horaInicio: deMinutos(h.inicioMin),
        horaFin: deMinutos(h.inicioMin + DURACION),
        motivo: n.motivo,
        score: n.score,
      })
    }
  }

  return sugerencias.sort((a, b) =>
    a.fecha === b.fecha ? a.horaInicio.localeCompare(b.horaInicio) : a.fecha.localeCompare(b.fecha),
  )
}
