export const DIAS_AVISO = [14, 7, 3, 2, 1, 0]
export const HORA_AVISO_DEFECTO = '09:00'

export function etiquetaDias(d: number): string {
  if (d === 0) return 'El mismo día'
  if (d === 7) return '1 semana'
  if (d === 14) return '2 semanas'
  return `${d} ${d === 1 ? 'día' : 'días'}`
}

/** «1 semana antes, 3 días antes y el mismo día, a las 09:00» */
export function describirAvisos(dias: number[], hora: string): string {
  if (!dias.length) return 'Sin avisos'
  const partes = [...dias]
    .sort((a, b) => b - a)
    .map((d) => (d === 0 ? 'el mismo día' : `${etiquetaDias(d)} antes`))
  const lista =
    partes.length === 1 ? partes[0] : `${partes.slice(0, -1).join(', ')} y ${partes.at(-1)}`
  return `${lista.charAt(0).toUpperCase()}${lista.slice(1)}, a las ${hora}`
}

/** Días elegidos cuyo aviso ya habría pasado para un examen en `fecha` (AAAA-MM-DD). */
export function avisosPasados(fecha: string, dias: number[], hora: string): number[] {
  if (!fecha) return []
  const [h, m] = hora.split(':').map(Number)
  return dias.filter((d) => {
    const cuando = new Date(`${fecha}T00:00`)
    cuando.setDate(cuando.getDate() - d)
    cuando.setHours(h, m, 0, 0)
    return cuando.getTime() <= Date.now()
  })
}
