import { CabeceraPagina, EstadoVacio } from '@/components/ui'
import { IconoHoy } from '@/components/iconos'
import { fechaLarga } from '@/lib/fechas'

export function Hoy() {
  const hoy = new Date()
  const saludo = hoy.getHours() < 14 ? 'Buenos días' : hoy.getHours() < 21 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <>
      <CabeceraPagina
        titulo={saludo}
        subtitulo={fechaLarga(hoy).replace(/^\w/, (c) => c.toUpperCase())}
      />
      <EstadoVacio
        icono={<IconoHoy className="size-8" />}
        titulo="El panel de hoy llegará en la Fase 06"
        texto="Aquí verás en 5 segundos qué alumnos vienen hoy, la próxima clase, las materias del día, tus horas libres y las alertas de exámenes."
      />
    </>
  )
}
