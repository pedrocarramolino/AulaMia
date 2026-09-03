import { CabeceraPagina, EstadoVacio } from '@/components/ui'
import { IconoExamenes } from '@/components/iconos'

export function Examenes() {
  return (
    <>
      <CabeceraPagina titulo="Exámenes" subtitulo="Próximas pruebas y plan de repaso" />
      <EstadoVacio
        icono={<IconoExamenes className="size-8" />}
        titulo="Los exámenes llegan en la Fase 06"
        texto="Fecha, temario, días restantes y nivel de preparación, con un plan de repaso que reparte el temario hasta el día de la prueba."
      />
    </>
  )
}
