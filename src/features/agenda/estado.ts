import type { Enums } from '@/lib/database.types'

export type EstadoClase = Enums<'estado_clase'>
export type OrigenClase = Enums<'origen_clase'>

export const ESTADO: Record<
  EstadoClase,
  { etiqueta: string; pill: string }
> = {
  programada: { etiqueta: 'Programada', pill: 'bg-accent-soft text-accent-ink' },
  realizada: { etiqueta: 'Realizada', pill: 'bg-good-soft text-good' },
  cancelada: { etiqueta: 'Cancelada', pill: 'bg-crit-soft text-crit' },
  aplazada: { etiqueta: 'Aplazada', pill: 'bg-warn-soft text-warn' },
  pendiente_recuperar: { etiqueta: 'A recuperar', pill: 'bg-warn-soft text-warn' },
}

export const ORIGEN: Record<OrigenClase, string> = {
  recurrente: 'Del horario habitual',
  manual: 'Añadida a mano',
  recuperacion: 'Recuperación',
  extraordinaria: 'Clase extraordinaria',
}
