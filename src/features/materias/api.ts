import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { claves } from '@/lib/claves'
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/database.types'

export type Materia = Tables<'materia'>

export function useMaterias() {
  return useQuery({
    queryKey: claves.materias,
    queryFn: async (): Promise<Materia[]> => {
      const { data, error } = await supabase
        .from('materia')
        .select('*')
        .order('nombre')
      if (error) throw error
      return data
    },
  })
}

export function useCrearMateria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (entrada: TablesInsert<'materia'>): Promise<Materia> => {
      const { data, error } = await supabase
        .from('materia')
        .insert(entrada)
        .select('*')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: claves.materias }),
  })
}

export function useActualizarMateria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      cambios,
    }: {
      id: string
      cambios: TablesUpdate<'materia'>
    }): Promise<Materia> => {
      const { data, error } = await supabase
        .from('materia')
        .update(cambios)
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: claves.materias }),
  })
}

export function useEliminarMateria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('materia').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: claves.materias })
      qc.invalidateQueries({ queryKey: ['alumno'] })
    },
  })
}
