import { NavLink, Outlet } from 'react-router-dom'
import { NAV } from './navegacion'
import { useSincronizarClasesAlEntrar } from '@/features/horarios/sincronizacion'
import { useGenerarRecordatoriosAlEntrar } from '@/features/recordatorios/api'

function claseEnlace(activo: boolean) {
  return [
    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
    activo
      ? 'bg-accent-soft text-accent-ink'
      : 'text-muted hover:bg-surface-2 hover:text-ink',
  ].join(' ')
}

function claseTab(activo: boolean) {
  return [
    'flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] font-medium transition-colors',
    activo ? 'text-accent-ink' : 'text-muted',
  ].join(' ')
}

export function AppLayout() {
  useSincronizarClasesAlEntrar()
  useGenerarRecordatoriosAlEntrar()

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[15rem_1fr]">
      {/* Barra lateral — escritorio */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface px-3 py-5 md:flex">
        <div className="px-3 pb-6">
          <span className="font-display text-xl font-bold tracking-tight text-ink">
            Aula<span className="text-accent-ink">Mia</span>
          </span>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ a, etiqueta, Icono, exacto }) => (
            <NavLink key={a} to={a} end={exacto} className={({ isActive }) => claseEnlace(isActive)}>
              <Icono className="size-5 shrink-0" />
              {etiqueta}
            </NavLink>
          ))}
        </nav>
        <p className="mt-auto px-3 font-mono text-[11px] text-muted">AulaMia · v0.1</p>
      </aside>

      {/* Contenido */}
      <div className="flex min-w-0 flex-col">
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-5 pb-24 md:px-8 md:pt-8 md:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Barra inferior — móvil */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg items-stretch gap-1 px-2 py-1.5">
          {NAV.map(({ a, etiqueta, Icono, exacto }) => (
            <NavLink key={a} to={a} end={exacto} className={({ isActive }) => claseTab(isActive)}>
              <Icono className="size-6" />
              {etiqueta}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
