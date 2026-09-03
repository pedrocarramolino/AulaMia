import { Link } from 'react-router-dom'
import { CabeceraPagina, EstadoVacio } from '@/components/ui'
import { IconoFlechaIzq } from '@/components/iconos'

export function Proximamente({
  titulo,
  fase,
  texto,
}: {
  titulo: string
  fase: string
  texto: string
}) {
  return (
    <>
      <Link
        to="/mas"
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
      >
        <IconoFlechaIzq className="size-4" /> Más
      </Link>
      <CabeceraPagina titulo={titulo} />
      <EstadoVacio titulo={`Llega en la ${fase}`} texto={texto} />
    </>
  )
}
