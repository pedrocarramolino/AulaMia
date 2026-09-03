import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { claves } from '@/lib/claves'
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/database.types'

type AlumnoMini = Pick<Tables<'alumno'>, 'id' | 'nombre' | 'apellidos' | 'color'>
type MateriaMini = Pick<Tables<'materia'>, 'id' | 'nombre' | 'color'>

export type Examen = Tables<'examen'> & {
  alumno: AlumnoMini
  materia: MateriaMini | null
  plan_examen: { count: number }[]
}

export type PasoPlan = Tables<'plan_examen'>

const SELECT =
  '*, alumno:alumno(id, nombre, apellidos, color), materia:materia(id, nombre, color), plan_examen(count)'

export function useExamenes(incluirPasados = false) {
  return useQuery({
    queryKey: [...claves.examenes, { incluirPasados }],
    queryFn: async (): Promise<Examen[]> => {
      let q = supabase.from('examen').select(SELECT).order('fecha')
      if (!incluirPasados) q = q.gte('fecha', new Date().toISOString().slice(0, 10))
      const { data, error } = await q
      if (error) throw error
      return data as Examen[]
    },
  })
}

export function useExamenesDeAlumno(alumnoId: string | undefined) {
  return useQuery({
    queryKey: claves.examenesDeAlumno(alumnoId ?? ''),
    enabled: !!alumnoId,
    queryFn: async (): Promise<Examen[]> => {
      const { data, error } = await supabase
        .from('examen')
        .select(SELECT)
        .eq('alumno_id', alumnoId!)
        .order('fecha', { ascending: false })
      if (error) throw error
      return data as Examen[]
    },
  })
}

export function useExamen(id: string | undefined) {
  return useQuery({
    queryKey: claves.examen(id ?? ''),
    enabled: !!id,
    queryFn: async (): Promise<Examen> => {
      const { data, error } = await supabase.from('examen').select(SELECT).eq('id', id!).single()
      if (error) throw error
      return data as Examen
    },
  })
}

function invalidar(qc: ReturnType<typeof useQueryClient>, id?: string, alumnoId?: string) {
  qc.invalidateQueries({ queryKey: claves.examenes })
  qc.invalidateQueries({ queryKey: claves.panel })
  if (id) qc.invalidateQueries({ queryKey: claves.examen(id) })
  if (alumnoId) qc.invalidateQueries({ queryKey: claves.examenesDeAlumno(alumnoId) })
}

export function useCrearExamen() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (entrada: TablesInsert<'examen'>): Promise<Tables<'examen'>> => {
      const { data, error } = await supabase.from('examen').insert(entrada).select('*').single()
      if (error) throw error
      return data
    },
    onSuccess: (e) => invalidar(qc, e.id, e.alumno_id),
  })
}

export function useActualizarExamen() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, cambios }: { id: string; cambios: TablesUpdate<'examen'> }) => {
      const { data, error } = await supabase
        .from('examen')
        .update(cambios)
        .eq('id', id)
        .select('alumno_id')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (d, v) => invalidar(qc, v.id, d?.alumno_id),
  })
}

export function useEliminarExamen() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string; alumnoId: string }) => {
      const { error } = await supabase.from('examen').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_d, v) => invalidar(qc, v.id, v.alumnoId),
  })
}

// ---------------------------------------------------------------------------
// Plan de examen (pasos de repaso)
// ---------------------------------------------------------------------------

export function usePlanExamen(examenId: string | undefined) {
  return useQuery({
    queryKey: claves.planExamen(examenId ?? ''),
    enabled: !!examenId,
    queryFn: async (): Promise<PasoPlan[]> => {
      const { data, error } = await supabase
        .from('plan_examen')
        .select('*')
        .eq('examen_id', examenId!)
        .order('fecha')
        .order('orden')
      if (error) throw error
      return data
    },
  })
}

export function useReemplazarPlanExamen(examenId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (pasos: Omit<TablesInsert<'plan_examen'>, 'examen_id'>[]) => {
      const del = await supabase.from('plan_examen').delete().eq('examen_id', examenId)
      if (del.error) throw del.error
      if (pasos.length) {
        const ins = await supabase
          .from('plan_examen')
          .insert(pasos.map((p) => ({ ...p, examen_id: examenId })))
        if (ins.error) throw ins.error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: claves.planExamen(examenId) })
      qc.invalidateQueries({ queryKey: claves.examenes })
    },
  })
}

export function useActualizarPaso(examenId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, cambios }: { id: string; cambios: TablesUpdate<'plan_examen'> }) => {
      const { error } = await supabase.from('plan_examen').update(cambios).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: claves.planExamen(examenId) }),
  })
}

export function useCrearPaso(examenId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (paso: Omit<TablesInsert<'plan_examen'>, 'examen_id'>) => {
      const { error } = await supabase.from('plan_examen').insert({ ...paso, examen_id: examenId })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: claves.planExamen(examenId) }),
  })
}

export function useEliminarPaso(examenId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('plan_examen').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: claves.planExamen(examenId) }),
  })
}
