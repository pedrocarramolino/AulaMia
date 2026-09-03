import {
  format,
  formatDistanceToNowStrict,
  differenceInCalendarDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  parseISO,
} from 'date-fns'
import { es } from 'date-fns/locale/es'

/** Opciones compartidas: semana en lunes, textos en español. */
const opts = { locale: es, weekStartsOn: 1 as const }

/** ISO `yyyy-MM-dd` a partir de un Date (para columnas `date` de Postgres). */
export function aISO(fecha: Date): string {
  return format(fecha, 'yyyy-MM-dd')
}

/** Convierte un `yyyy-MM-dd` de la base de datos a Date local (sin desfase de zona). */
export function deISO(iso: string): Date {
  return parseISO(iso)
}

/** `03/09/2026` */
export function fechaCorta(fecha: Date | string): string {
  const d = typeof fecha === 'string' ? deISO(fecha) : fecha
  return format(d, 'dd/MM/yyyy', opts)
}

/** `miércoles, 3 de septiembre` */
export function fechaLarga(fecha: Date | string): string {
  const d = typeof fecha === 'string' ? deISO(fecha) : fecha
  return format(d, "EEEE, d 'de' MMMM", opts)
}

/** `mié 3` — encabezado de columna de la vista semanal */
export function diaCompacto(fecha: Date): string {
  return format(fecha, 'EEE d', opts)
}

/** `septiembre de 2026` */
export function mesLargo(fecha: Date): string {
  return format(fecha, "MMMM 'de' yyyy", opts)
}

/** `17:00` a partir de un `time` de Postgres (`17:00:00`) o un Date. */
export function hora(valor: string | Date): string {
  if (valor instanceof Date) return format(valor, 'HH:mm')
  return valor.slice(0, 5)
}

/** `17:00–18:00` */
export function franja(inicio: string, fin: string): string {
  return `${hora(inicio)}–${hora(fin)}`
}

/** Días de calendario entre hoy y una fecha (negativo si ya pasó). */
export function diasRestantes(fecha: Date | string): number {
  const d = typeof fecha === 'string' ? deISO(fecha) : fecha
  return differenceInCalendarDays(d, new Date())
}

/** `en 3 días`, `hace 2 horas` */
export function relativo(fecha: Date | string): string {
  const d = typeof fecha === 'string' ? deISO(fecha) : fecha
  return formatDistanceToNowStrict(d, { locale: es, addSuffix: true })
}

/** Nombres de los días de la semana empezando en lunes. */
export const DIAS_SEMANA = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
] as const

/** Abreviaturas L M X J V S D. */
export const DIAS_ABREV = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const

export function rangoSemana(fecha: Date) {
  return {
    inicio: startOfWeek(fecha, opts),
    fin: endOfWeek(fecha, opts),
  }
}

export function rangoMes(fecha: Date) {
  return {
    inicio: startOfMonth(fecha),
    fin: endOfMonth(fecha),
  }
}

/** Los 7 Date de la semana que contiene `fecha`, de lunes a domingo. */
export function diasDeLaSemana(fecha: Date): Date[] {
  const inicio = startOfWeek(fecha, opts)
  return Array.from({ length: 7 }, (_, i) => addDays(inicio, i))
}

/** `dia_semana` de Postgres (1 = lunes … 7 = domingo) a partir de un Date. */
export function diaSemanaISO(fecha: Date): number {
  const js = fecha.getDay() // 0 = domingo
  return js === 0 ? 7 : js
}
