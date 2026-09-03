/** Paleta de colores identificativos para los alumnos. Tonos distinguibles entre sí
 *  y legibles con texto blanco encima. */
export const PALETA_ALUMNOS = [
  { hex: '#4353c4', nombre: 'Añil' },
  { hex: '#2f8f83', nombre: 'Turquesa' },
  { hex: '#3a7bd5', nombre: 'Azul' },
  { hex: '#7c5cd6', nombre: 'Violeta' },
  { hex: '#c0417a', nombre: 'Frambuesa' },
  { hex: '#d1495b', nombre: 'Rojo' },
  { hex: '#e07a3f', nombre: 'Naranja' },
  { hex: '#c99700', nombre: 'Mostaza' },
  { hex: '#5a8f3c', nombre: 'Verde' },
  { hex: '#0d7d8c', nombre: 'Petróleo' },
  { hex: '#8a6d3b', nombre: 'Tierra' },
  { hex: '#5b6472', nombre: 'Pizarra' },
] as const

export const COLOR_ALUMNO_POR_DEFECTO = PALETA_ALUMNOS[0].hex

/** Nombre legible de un hex de la paleta (o el propio hex si no está). */
export function nombreColor(hex: string): string {
  return PALETA_ALUMNOS.find((c) => c.hex.toLowerCase() === hex.toLowerCase())?.nombre ?? hex
}
