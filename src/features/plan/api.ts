import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { claves } from '@/lib/claves'
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/database.types'

export type PlanSesion = Tables<'plan_sesion'>
export type Tarea = Tables<'tarea'>

// ---------------------------------------------------------------------------
// Plan de sesión (1:1 con la clase)
// ---------------------------------------------------------------------------

export function usePlanSesion(claseId: string | undefined) {
  return useQuery({
    queryKey: claves.planSesion(claseId ?? ''),
    enabled: !!claseId,
    queryFn: async (): Promise<PlanSesion | null> => {
      const { data, error } = await supabase
        .from('plan_sesion')
        .select('*')
        .eq('clase_id', claseId!)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

/** Guarda campos sueltos del plan (upsert por clase_id). */
export function useGuardarPlan(claseId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (campos: Partial<TablesUpdate<'plan_sesion'>>) => {
      const { error } = await supabase
        .from('plan_sesion')
        .upsert({ clase_id: claseId, ...campos }, { onConflict: 'clase_id' })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: claves.planSesion(claseId) })
      qc.invalidateQueries({ queryKey: claves.clases })
    },
  })
}

// ---------------------------------------------------------------------------
// Tareas
// ---------------------------------------------------------------------------

export function useTareasDeClase(claseId: string | undefined) {
  return useQuery({
    queryKey: claves.tareasDeClase(claseId ?? ''),
    enabled: !!claseId,
    queryFn: async (): Promise<Tarea[]> => {
      const { data, error } = await supabase
        .from('tarea')
        .select('*')
        .eq('clase_id', claseId!)
        .order('creado_en')
      if (error) throw error
      return data
    },
  })
}

export type TareaConContexto = Tarea & {
  materia: Pick<Tables<'materia'>, 'nombre'> | null
}

export function useTareasPendientesDeAlumno(alumnoId: string | undefined) {
  return useQuery({
    queryKey: claves.tareasDeAlumno(alumnoId ?? ''),
    enabled: !!alumnoId,
    queryFn: async (): Promise<TareaConContexto[]> => {
      const { data, error } = await supabase
        .from('tarea')
        .select('*, materia:materia(nombre)')
        .eq('alumno_id', alumnoId!)
        .eq('completada', false)
        .order('fecha_limite', { nullsFirst: false })
      if (error) throw error
      return data as TareaConContexto[]
    },
  })
}

function invalidarTareas(qc: ReturnType<typeof useQueryClient>, t: { clase_id?: string | null; alumno_id: string }) {
  if (t.clase_id) qc.invalidateQueries({ queryKey: claves.tareasDeClase(t.clase_id) })
  qc.invalidateQueries({ queryKey: claves.tareasDeAlumno(t.alumno_id) })
}

export function useCrearTarea() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (entrada: TablesInsert<'tarea'>): Promise<Tarea> => {
      const { data, error } = await supabase.from('tarea').insert(entrada).select('*').single()
      if (error) throw error
      return data
    },
    onSuccess: (t) => invalidarTareas(qc, t),
  })
}

type CtxTarea = { clase_id?: string | null; alumno_id: string }

export function useActualizarTarea() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: { id: string; cambios: TablesUpdate<'tarea'>; _ctx: CtxTarea }) => {
      const { error } = await supabase.from('tarea').update(v.cambios).eq('id', v.id)
      if (error) throw error
    },
    onSuccess: (_d, v) => invalidarTareas(qc, v._ctx),
  })
}

export function useEliminarTarea() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: { id: string; _ctx: CtxTarea }) => {
      const { error } = await supabase.from('tarea').delete().eq('id', v.id)
      if (error) throw error
    },
    onSuccess: (_d, v) => invalidarTareas(qc, v._ctx),
  })
}
