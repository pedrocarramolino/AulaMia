import { useEffect, useState } from 'react'
import { Input, Textarea } from '@/components/campos'
import { usePlanSesion, useGuardarPlan } from './api'

const NIVELES = [
  { n: 1, txt: 'Muy flojo' },
  { n: 2, txt: 'Flojo' },
  { n: 3, txt: 'Regular' },
  { n: 4, txt: 'Bien' },
  { n: 5, txt: 'Dominado' },
]

function Progreso({
  valor,
  onChange,
}: {
  valor: number | null
  onChange: (v: number | null) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted">Progreso del alumno en el tema</span>
      <div className="flex items-center gap-2">
        <div className="flex gap-1.5">
          {NIVELES.map(({ n }) => (
            <button
              key={n}
              type="button"
              aria-label={`Nivel ${n}`}
              onClick={() => onChange(valor === n ? null : n)}
              className={`size-7 rounded-full border transition-colors ${
                valor && n <= valor
                  ? 'border-accent bg-accent'
                  : 'border-line-strong bg-ground hover:border-accent'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-muted">
          {valor ? NIVELES[valor - 1].txt : 'Sin valorar'}
        </span>
      </div>
    </div>
  )
}

export function PlanSesion({ claseId }: { claseId: string }) {
  const { data: plan, isLoading } = usePlanSesion(claseId)
  const guardar = useGuardarPlan(claseId)

  const [tema, setTema] = useState('')
  const [objetivo, setObjetivo] = useState('')
  const [contenido, setContenido] = useState('')
  const [deberes, setDeberes] = useState('')

  useEffect(() => {
    setTema(plan?.tema ?? '')
    setObjetivo(plan?.objetivo ?? '')
    setContenido(plan?.contenido ?? '')
    setDeberes(plan?.deberes_casa ?? '')
  }, [plan])

  const guardarCampo = (campo: string, valor: string, anterior: string | null) => {
    if ((valor.trim() || null) !== (anterior ?? null)) {
      guardar.mutate({ [campo]: valor.trim() || null })
    }
  }

  if (isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-surface-2" />

  return (
    <section className="rounded-2xl border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-ink">Plan de la sesión</h2>
        {guardar.isPending && <span className="text-xs text-muted">Guardando…</span>}
      </div>

      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Tema
          <Input
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            onBlur={() => guardarCampo('tema', tema, plan?.tema ?? null)}
            placeholder="Ecuaciones de primer grado"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Objetivo de la sesión
          <Input
            value={objetivo}
            onChange={(e) => setObjetivo(e.target.value)}
            onBlur={() => guardarCampo('objetivo', objetivo, plan?.objetivo ?? null)}
            placeholder="Resolver ecuaciones con paréntesis"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Contenido / qué se trabaja
          <Textarea
            rows={2}
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            onBlur={() => guardarCampo('contenido', contenido, plan?.contenido ?? null)}
            placeholder="Ejercicios 1–10 de la ficha, repaso de la teoría"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Deberes para casa
          <Textarea
            rows={2}
            value={deberes}
            onChange={(e) => setDeberes(e.target.value)}
            onBlur={() => guardarCampo('deberes_casa', deberes, plan?.deberes_casa ?? null)}
            placeholder="Ejercicios 11–20"
          />
        </label>

        <Progreso
          valor={plan?.nivel_progreso ?? null}
          onChange={(v) => guardar.mutate({ nivel_progreso: v })}
        />
      </div>
    </section>
  )
}
