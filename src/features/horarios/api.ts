import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { claves } from '@/lib/claves'
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/database.types'

export type Horario = Tables<'horario_recurrente'> & {
  materia: Pick<Tables<'materia'>, 'id' | 'nombre' | 'color'> | null
}

function invalidarTodo(qc: ReturnType<typeof useQueryClient>, alumnoId: string) {
  qc.invalidateQueries({ queryKey: claves.horariosDeAlumno(alumnoId) })
  qc.invalidateQueries({ queryKey: claves.clases })
}

export function useHorariosDeAlumno(alumnoId: string | undefined) {
  return useQuery({
    queryKey: claves.horariosDeAlumno(alumnoId ?? ''),
    enabled: !!alumnoId,
    queryFn: async (): Promise<Horario[]> => {
      const { data, error } = await supabase
        .from('horario_recurrente')
        .select('*, materia:materia(id, nombre, color)')
        .eq('alumno_id', alumnoId!)
        .order('dia_semana')
        .order('hora_inicio')
      if (error) throw error
      return data as Horario[]
    },
  })
}

export function useCrearHorario(alumnoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (entrada: TablesInsert<'horario_recurrente'>) => {
      const { error } = await supabase.from('horario_recurrente').insert(entrada)
      if (error) throw error
    },
    onSuccess: () => invalidarTodo(qc, alumnoId),
  })
}

export function useActualizarHorario(alumnoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      cambios,
    }: {
      id: string
      cambios: TablesUpdate<'horario_recurrente'>
    }) => {
      const { error } = await supabase
        .from('horario_recurrente')
        .update(cambios)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => invalidarTodo(qc, alumnoId),
  })
}

export function useEliminarHorario(alumnoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('horario_recurrente').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => invalidarTodo(qc, alumnoId),
  })
}

/** Pide al servidor que materialice las clases del usuario (RPC). */
export function useGenerarClases() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (): Promise<number> => {
      const { data, error } = await supabase.rpc('generar_mis_clases', {})
      if (error) throw error
      return data ?? 0
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: claves.clases }),
  })
}
