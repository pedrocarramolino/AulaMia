import { CabeceraPagina, EstadoVacio } from '@/components/ui'
import { IconoAlumnos } from '@/components/iconos'

export function Alumnos() {
  return (
    <>
      <CabeceraPagina titulo="Alumnos" subtitulo="Fichas, materias e historial" />
      <EstadoVacio
        icono={<IconoAlumnos className="size-8" />}
        titulo="Las fichas de alumnos llegan en la Fase 02"
        texto="Nombre, curso, color identificativo, materias con su nivel y dificultades, horario habitual, precio e historial de clases."
      />
    </>
  )
}
