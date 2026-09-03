import {
  format,
  formatDistanceToNowStrict,
  differenceInCalendarDays,
  differenceInYears,
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

/** Minutos desde medianoche de un `HH:MM`. */
export function aMinutos(hhmm: string): number {
  const [h, m] = hhmm.slice(0, 5).split(':').map(Number)
  return h * 60 + m
}

/** `HH:MM` a partir de minutos desde medianoche. */
export function deMinutos(min: number): string {
  const m = ((min % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/** Suma minutos a un `HH:MM` y devuelve `HH:MM`. */
export function sumarMinutos(hhmm: string, min: number): string {
  return deMinutos(aMinutos(hhmm) + min)
}

/** `1 h`, `1 h 30 min`, `45 min` */
export function duracionLegible(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h && m) return `${h} h ${m} min`
  if (h) return `${h} h`
  return `${m} min`
}

/** Opciones habituales de duración de una clase, en minutos. */
export const DURACIONES = [30, 45, 60, 75, 90, 120] as const

/** Edad en años a partir de la fecha de nacimiento (`yyyy-MM-dd` o Date). */
export function edad(fechaNacimiento: Date | string): number {
  const d = typeof fechaNacimiento === 'string' ? deISO(fechaNacimiento) : fechaNacimiento
  return differenceInYears(new Date(), d)
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
