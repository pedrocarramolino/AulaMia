import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { addDays } from 'date-fns'
import { CabeceraPagina } from '@/components/ui'
import {
  aISO,
  fechaLarga,
  franja,
  hora,
  diaSemanaISO,
  aMinutos,
  duracionLegible,
  diasRestantes,
} from '@/lib/fechas'
import { AvatarAlumno } from '@/features/alumnos/componentes'
import { useClasesRango, useClasesPendientesRecuperar, type ClaseAgenda } from '@/features/agenda/api'
import { useExamenes } from '@/features/examenes/api'
import { useDisponibilidad } from '@/features/disponibilidad/api'
import { DiasBadge } from '@/features/examenes/componentes'
import { Avisos } from '@/features/recordatorios/Avisos'

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const nowMin = () => {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

function FilaClaseMini({ clase }: { clase: ClaseAgenda }) {
  return (
    <Link
      to={`/agenda/clase/${clase.id}`}
      className="flex items-center gap-2.5 py-1.5"
    >
      <span className="w-11 shrink-0 font-mono text-xs text-muted">{hora(clase.hora_inicio)}</span>
      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: clase.alumno.color }} />
      <span className="min-w-0 flex-1 truncate text-sm text-ink">
        {clase.alumno.nombre}
        <span className="text-muted"> · {clase.materia?.nombre ?? 'Sin materia'}</span>
      </span>
    </Link>
  )
}

export function PaginaHoy() {
  const navigate = useNavigate()
  const hoy = useMemo(() => new Date(), [])
  const hoyISO = aISO(hoy)

  const { data: semana, isLoading } = useClasesRango(hoyISO, aISO(addDays(hoy, 7)))
  const { data: examenes } = useExamenes()
  const { data: disponibilidad } = useDisponibilidad()
  const { data: pendientesRecuperar } = useClasesPendientesRecuperar()

  const vm = useMemo(() => {
    const clases = semana ?? []
    const deHoy = clases
      .filter((c) => c.fecha === hoyISO && c.estado !== 'cancelada')
      .sort((a, b) => aMinutos(a.hora_inicio) - aMinutos(b.hora_inicio))

    const n = nowMin()
    const enCurso = deHoy.find((c) => aMinutos(c.hora_inicio) <= n && aMinutos(c.hora_fin) > n)
    const proxima = deHoy.find((c) => aMinutos(c.hora_inicio) > n)

    const alumnosHoy = Array.from(new Map(deHoy.map((c) => [c.alumno.id, c.alumno])).values())
    const materiasHoy = Array.from(
      new Set(deHoy.map((c) => c.materia?.nombre).filter(Boolean) as string[]),
    )

    const dispHoy = (disponibilidad ?? []).filter((t) => t.dia_semana === diaSemanaISO(hoy))
    const minDisp = dispHoy.reduce((s, t) => s + aMinutos(t.hora_fin) - aMinutos(t.hora_inicio), 0)
    const minOcup = deHoy.reduce((s, c) => s + aMinutos(c.hora_fin) - aMinutos(c.hora_inicio), 0)
    const minLibres = Math.max(minDisp - minOcup, 0)

    const proximosDias = clases
      .filter((c) => c.fecha > hoyISO && c.estado !== 'cancelada')
      .sort((a, b) =>
        a.fecha === b.fecha
          ? aMinutos(a.hora_inicio) - aMinutos(b.hora_inicio)
          : a.fecha.localeCompare(b.fecha),
      )

    const grupos: { fecha: string; clases: ClaseAgenda[] }[] = []
    for (const c of proximosDias) {
      const g = grupos.find((x) => x.fecha === c.fecha)
      if (g) g.clases.push(c)
      else grupos.push({ fecha: c.fecha, clases: [c] })
    }

    const examenesProximos = (examenes ?? []).filter((e) => {
      const d = diasRestantes(e.fecha)
      return d >= 0 && d <= 30
    })

    const alertas: { clave: string; texto: string; a: string; nivel: 'crit' | 'warn' }[] = []
    for (const e of examenes ?? []) {
      const d = diasRestantes(e.fecha)
      if (d >= 0 && d <= 7) {
        alertas.push({
          clave: `ex-${e.id}`,
          texto: `${e.titulo} (${e.alumno.nombre}) ${d === 0 ? 'hoy' : d === 1 ? 'mañana' : `en ${d} días`}`,
          a: `/examenes/${e.id}`,
          nivel: d <= 3 ? 'crit' : 'warn',
        })
      } else if (d >= 0 && d <= 14 && (e.plan_examen[0]?.count ?? 0) === 0) {
        alertas.push({
          clave: `plan-${e.id}`,
          texto: `El examen de ${e.alumno.nombre} no tiene plan de repaso`,
          a: `/examenes/${e.id}`,
          nivel: 'warn',
        })
      }
    }
    for (const c of pendientesRecuperar ?? []) {
      alertas.push({
        clave: `rec-${c.id}`,
        texto: `Clase de ${c.alumno.nombre} pendiente de recuperar`,
        a: `/agenda/clase/${c.id}`,
        nivel: 'warn',
      })
    }

    return {
      deHoy,
      enCurso,
      proxima,
      alumnosHoy,
      materiasHoy,
      minLibres,
      grupos: grupos.slice(0, 4),
      examenesProximos,
      alertas,
    }
  }, [semana, examenes, disponibilidad, pendientesRecuperar, hoy, hoyISO])

  const saludo =
    hoy.getHours() < 14 ? 'Buenos días' : hoy.getHours() < 21 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <>
      <CabeceraPagina titulo={saludo} subtitulo={cap(fechaLarga(hoy))} />

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-surface-2" />
      ) : (
        <div className="flex flex-col gap-5">
          <Avisos />

          {/* HOY */}
          <section className="rounded-2xl border border-line bg-surface p-4">
            <p className="font-mono text-[11px] uppercase tracking-wider text-accent-ink">Hoy</p>

            {vm.deHoy.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No tienes clases hoy. Día libre.</p>
            ) : (
              <>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-display text-3xl font-bold text-ink">{vm.deHoy.length}</span>
                  <span className="text-sm text-muted">
                    {vm.deHoy.length === 1 ? 'clase' : 'clases'} · {duracionLegible(vm.minLibres)} libres
                  </span>
                </div>

                {(vm.enCurso || vm.proxima) && (
                  <Link
                    to={`/agenda/clase/${(vm.enCurso ?? vm.proxima)!.id}`}
                    className="mt-3 flex items-center gap-3 rounded-xl bg-accent-soft p-3"
                  >
                    <AvatarAlumno
                      nombre={(vm.enCurso ?? vm.proxima)!.alumno.nombre}
                      apellidos={(vm.enCurso ?? vm.proxima)!.alumno.apellidos}
                      color={(vm.enCurso ?? vm.proxima)!.alumno.color}
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-ink">
                        {vm.enCurso ? 'Ahora' : 'Próxima clase'}
                      </p>
                      <p className="truncate text-sm font-medium text-ink">
                        {(vm.enCurso ?? vm.proxima)!.alumno.nombre} ·{' '}
                        {(vm.enCurso ?? vm.proxima)!.materia?.nombre ?? 'Sin materia'}
                      </p>
                      <p className="font-mono text-xs text-muted">
                        {franja(
                          (vm.enCurso ?? vm.proxima)!.hora_inicio,
                          (vm.enCurso ?? vm.proxima)!.hora_fin,
                        )}
                      </p>
                    </div>
                  </Link>
                )}
                {!vm.enCurso && !vm.proxima && (
                  <p className="mt-2 text-sm text-good">Ya has terminado por hoy.</p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {vm.alumnosHoy.map((a) => (
                    <span key={a.id} title={a.nombre}>
                      <AvatarAlumno nombre={a.nombre} apellidos={a.apellidos} color={a.color} tam="sm" />
                    </span>
                  ))}
                </div>
                {vm.materiasHoy.length > 0 && (
                  <p className="mt-2 text-xs text-muted">{vm.materiasHoy.join(' · ')}</p>
                )}

                <div className="mt-3 border-t border-line pt-2">
                  {vm.deHoy.map((c) => (
                    <FilaClaseMini key={c.id} clase={c} />
                  ))}
                </div>
              </>
            )}
          </section>

          {/* PRÓXIMOS DÍAS */}
          <section>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted">
              Próximos días
            </p>
            {vm.grupos.length === 0 && vm.examenesProximos.length === 0 ? (
              <p className="text-sm text-muted">Nada programado en la próxima semana.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {vm.grupos.map((g) => (
                  <div key={g.fecha} className="rounded-2xl border border-line bg-surface p-4">
                    <p className="text-sm font-semibold text-ink">{cap(fechaLarga(g.fecha))}</p>
                    <div className="mt-1">
                      {g.clases.map((c) => (
                        <FilaClaseMini key={c.id} clase={c} />
                      ))}
                    </div>
                  </div>
                ))}
                {vm.examenesProximos.map((e) => (
                  <Link
                    key={e.id}
                    to={`/examenes/${e.id}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4"
                  >
                    <span className="min-w-0 truncate text-sm text-ink">
                      📝 {e.titulo} · {e.alumno.nombre}
                    </span>
                    <DiasBadge fecha={e.fecha} />
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* ALERTAS */}
          {vm.alertas.length > 0 && (
            <section>
              <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted">Alertas</p>
              <div className="flex flex-col gap-2">
                {vm.alertas.map((al) => (
                  <button
                    key={al.clave}
                    onClick={() => navigate(al.a)}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm ${
                      al.nivel === 'crit'
                        ? 'border-crit/30 bg-crit-soft text-crit'
                        : 'border-warn/30 bg-warn-soft text-warn'
                    }`}
                  >
                    <span className="size-1.5 shrink-0 rounded-full bg-current" />
                    <span className="min-w-0 flex-1">{al.texto}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  )
}
