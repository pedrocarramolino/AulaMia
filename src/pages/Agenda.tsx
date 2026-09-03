import { CabeceraPagina, EstadoVacio } from '@/components/ui'
import { IconoAgenda } from '@/components/iconos'

export function Agenda() {
  return (
    <>
      <CabeceraPagina titulo="Agenda" subtitulo="Día · Semana · Mes" />
      <EstadoVacio
        icono={<IconoAgenda className="size-8" />}
        titulo="El calendario llegará en la Fase 04"
        texto="Vistas de día, semana y mes con bloques de color por alumno, arrastrar para mover clases y detección de conflictos."
      />
    </>
  )
}
