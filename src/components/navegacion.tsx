import type { ComponentType, SVGProps } from 'react'
import {
  IconoHoy,
  IconoAgenda,
  IconoAlumnos,
  IconoExamenes,
  IconoMas,
} from './iconos'

export interface ItemNav {
  a: string
  etiqueta: string
  Icono: ComponentType<SVGProps<SVGSVGElement>>
  /** Coincidencia exacta de ruta (solo para "Hoy"). */
  exacto?: boolean
}

export const NAV: ItemNav[] = [
  { a: '/', etiqueta: 'Hoy', Icono: IconoHoy, exacto: true },
  { a: '/agenda', etiqueta: 'Agenda', Icono: IconoAgenda },
  { a: '/alumnos', etiqueta: 'Alumnos', Icono: IconoAlumnos },
  { a: '/examenes', etiqueta: 'Exámenes', Icono: IconoExamenes },
  { a: '/mas', etiqueta: 'Más', Icono: IconoMas },
]
