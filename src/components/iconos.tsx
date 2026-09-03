import type { ReactNode, SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement>

function Base({ children, ...props }: Props & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={22}
      height={22}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export const IconoSobre = (p: Props) => (
  <Base {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m4 7 8 6 8-6" />
  </Base>
)

export const IconoOjo = (p: Props) => (
  <Base {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Base>
)

export const IconoOjoTachado = (p: Props) => (
  <Base {...p}>
    <path d="M9.9 5.7A9.8 9.8 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.3 3.9M6.3 6.8A17 17 0 0 0 2.5 12S6 18.5 12 18.5a9.4 9.4 0 0 0 4.1-.9" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" />
  </Base>
)

export const IconoHoy = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Base>
)

export const IconoAgenda = (p: Props) => (
  <Base {...p}>
    <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
    <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
    <path d="M7.5 13h3M13.5 13h3M7.5 16.5h3M13.5 16.5h3" />
  </Base>
)

export const IconoAlumnos = (p: Props) => (
  <Base {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19.5c0-3 2.6-5 5.5-5s5.5 2 5.5 5" />
    <path d="M16 6.5a3 3 0 0 1 0 5.8M17.5 19.5c0-2.4-1-4-2.8-4.8" />
  </Base>
)

export const IconoExamenes = (p: Props) => (
  <Base {...p}>
    <rect x="5" y="3.5" width="14" height="17" rx="2.2" />
    <path d="M9 3.5V6h6V3.5" />
    <path d="M8.5 11l2 2 4-4.5" />
    <path d="M8.5 16.5h7" />
  </Base>
)

export const IconoMas = (p: Props) => (
  <Base {...p}>
    <circle cx="5.5" cy="6" r="1.6" />
    <circle cx="5.5" cy="12" r="1.6" />
    <circle cx="5.5" cy="18" r="1.6" />
    <path d="M10.5 6h9M10.5 12h9M10.5 18h9" />
  </Base>
)

export const IconoSol = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8" />
  </Base>
)

export const IconoLuna = (p: Props) => (
  <Base {...p}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5z" />
  </Base>
)

export const IconoSistema = (p: Props) => (
  <Base {...p}>
    <rect x="3" y="4.5" width="18" height="12" rx="2" />
    <path d="M8 20.5h8M12 16.5v4" />
  </Base>
)

export const IconoSalir = (p: Props) => (
  <Base {...p}>
    <path d="M15 4.5H6.5A2.5 2.5 0 0 0 4 7v10a2.5 2.5 0 0 0 2.5 2.5H15" />
    <path d="M16 8.5 20 12l-4 3.5M9.5 12H20" />
  </Base>
)

export const IconoMas1 = (p: Props) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
)

export const IconoBuscar = (p: Props) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4-4" />
  </Base>
)

export const IconoFlechaDer = (p: Props) => (
  <Base {...p}>
    <path d="m9 5 7 7-7 7" />
  </Base>
)

export const IconoFlechaIzq = (p: Props) => (
  <Base {...p}>
    <path d="m15 5-7 7 7 7" />
  </Base>
)

export const IconoDisponibilidad = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Base>
)

export const IconoEstadisticas = (p: Props) => (
  <Base {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </Base>
)

export const IconoMateria = (p: Props) => (
  <Base {...p}>
    <path d="M5 4.5h11a2 2 0 0 1 2 2V21l-4-2.2L10 21V6.5a2 2 0 0 0-2-2H5z" />
  </Base>
)

export const IconoPlanificador = (p: Props) => (
  <Base {...p}>
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
    <circle cx="12" cy="12" r="4.5" />
    <path d="M12 9.5v2.5l1.8 1" />
  </Base>
)

export const IconoAjustes = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7 5.6 5.6" />
  </Base>
)
