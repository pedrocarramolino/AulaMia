import type { ReactNode } from 'react'

/** Marco compartido de las pantallas de acceso: fondo, logo y contenedor centrado. */
export function AuthLayout({
  children,
  subtitulo,
}: {
  children: ReactNode
  subtitulo?: string
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ground px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center text-center">
          <img
            src="/pwa-512.png"
            alt=""
            width={72}
            height={72}
            className="rounded-2xl shadow-[0_2px_10px_-3px_rgba(20,25,40,0.25)]"
          />
          <span className="mt-3 font-display text-2xl font-bold tracking-tight text-ink">
            Aula<span className="text-accent-ink">Mia</span>
          </span>
          {subtitulo && <p className="mt-1 text-sm text-muted">{subtitulo}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}
