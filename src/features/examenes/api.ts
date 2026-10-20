import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FunctionsHttpError } from '@supabase/supabase-js'
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

// ---------------------------------------------------------------------------
// Apuntes generados (Edge Function `generar-apuntes`)
// ---------------------------------------------------------------------------

export interface TemaApuntes {
  titulo: string
  explicacion: string
  puntos_clave: string[]
  conceptos: { termino: string; definicion: string }[]
  preguntas: { pregunta: string; respuesta: string }[]
}

export type ApuntesExamen = Omit<Tables<'apuntes_examen'>, 'contenido'> & {
  contenido: { temas: TemaApuntes[] }
}

export function useApuntesExamen(examenId: string | undefined) {
  return useQuery({
    queryKey: claves.apuntesExamen(examenId ?? ''),
    enabled: !!examenId,
    queryFn: async (): Promise<ApuntesExamen | null> => {
      const { data, error } = await supabase
        .from('apuntes_examen')
        .select('*')
        .eq('examen_id', examenId!)
        .maybeSingle()
      if (error) throw error
      return data as ApuntesExamen | null
    },
  })
}

const ERRORES_APUNTES: Record<string, string> = {
  falta_clave:
    'Falta configurar la clave de Anthropic: añade el secreto ANTHROPIC_API_KEY en las Edge Functions de Supabase.',
  clave_invalida: 'La clave de Anthropic no es válida o no tiene saldo.',
  limite: 'Demasiadas peticiones seguidas. Prueba de nuevo en un minuto.',
  rechazado: 'No se han podido generar estos apuntes. Prueba a describir el examen de otra forma.',
  demasiado_largo:
    'El examen abarca demasiado para unos apuntes. Prueba a centrarlo en menos temas.',
}

export function useGenerarApuntes(examenId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (entrada: { descripcion: string; enfoque: string }) => {
      const { error } = await supabase.functions.invoke('generar-apuntes', {
        body: { examen_id: examenId, ...entrada },
      })
      if (!error) return
      let codigo = ''
      if (error instanceof FunctionsHttpError) {
        try {
          codigo = ((await error.context.json()) as { error?: string }).error ?? ''
        } catch {
          // Respuesta sin JSON: se queda el mensaje genérico.
        }
      }
      throw new Error(ERRORES_APUNTES[codigo] ?? 'No se han podido generar los apuntes. Inténtalo de nuevo.')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: claves.apuntesExamen(examenId) }),
  })
}
