import { Component, type ReactNode } from 'react'
import { Boton } from './ui'

const CLAVE_RECARGA = 'aulamia:recarga-tras-error'

function esErrorDeCarga(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error)
  return /dynamically imported module|loading chunk|failed to fetch/i.test(msg)
}

interface Estado {
  error: Error | null
}

/**
 * Red de seguridad para toda la app: sin esto, cualquier error al renderizar
 * (o un chunk que ya no existe tras un despliegue nuevo) deja la pantalla
 * en blanco sin ninguna pista. Un error de carga de chunk se recarga solo
 * una vez; si eso no lo arregla, o es otro tipo de error, se muestra un
 * aviso con botón de recargar en vez de dejar la pantalla en blanco.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, Estado> {
  state: Estado = { error: null }

  static getDerivedStateFromError(error: Error): Estado {
    return { error }
  }

  componentDidMount() {
    // Solo se limpia si tras unos segundos la app sigue en pie: evita un
    // bucle de recargas si el chunk sigue fallando tras la primera.
    setTimeout(() => sessionStorage.removeItem(CLAVE_RECARGA), 5000)
  }

  componentDidCatch(error: Error) {
    if (esErrorDeCarga(error) && !sessionStorage.getItem(CLAVE_RECARGA)) {
      sessionStorage.setItem(CLAVE_RECARGA, '1')
      window.location.reload()
    }
  }

  render() {
    if (this.state.error) {
      const yaRecargo = esErrorDeCarga(this.state.error) && sessionStorage.getItem(CLAVE_RECARGA)
      if (yaRecargo) return null

      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-ground px-6 text-center">
          <p className="font-display text-lg font-semibold text-ink">Algo ha ido mal</p>
          <p className="max-w-xs text-sm text-muted">
            La app se ha encontrado con un error inesperado. Recarga la página para
            seguir.
          </p>
          <Boton
            onClick={() => {
              sessionStorage.removeItem(CLAVE_RECARGA)
              window.location.reload()
            }}
          >
            Recargar
          </Boton>
        </div>
      )
    }
    return this.props.children
  }
}
