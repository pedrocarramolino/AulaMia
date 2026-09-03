import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { claves } from '@/lib/claves'
import type { Tables, TablesInsert } from '@/lib/database.types'

export type Tramo = Tables<'disponibilidad'>
export type Excepcion = Tables<'disponibilidad_excepcion'>

// ---------------------------------------------------------------------------
// Disponibilidad semanal
// ---------------------------------------------------------------------------

export function useDisponibilidad() {
  return useQuery({
    queryKey: claves.disponibilidad,
    queryFn: async (): Promise<Tramo[]> => {
      const { data, error } = await supabase
        .from('disponibilidad')
        .select('*')
        .order('dia_semana')
        .order('hora_inicio')
      if (error) throw error
      return data
    },
  })
}

export function useCrearTramo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (entrada: TablesInsert<'disponibilidad'>) => {
      const { error } = await supabase.from('disponibilidad').insert(entrada)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: claves.disponibilidad }),
  })
}

export function useEliminarTramo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('disponibilidad').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: claves.disponibilidad }),
  })
}

/** Reemplaza todos los tramos de un día por los indicados. */
export function useReemplazarDia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      dia,
      tramos,
    }: {
      dia: number
      tramos: { hora_inicio: string; hora_fin: string }[]
    }) => {
      const del = await supabase.from('disponibilidad').delete().eq('dia_semana', dia)
      if (del.error) throw del.error
      if (tramos.length) {
        const ins = await supabase
          .from('disponibilidad')
          .insert(tramos.map((t) => ({ ...t, dia_semana: dia })))
        if (ins.error) throw ins.error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: claves.disponibilidad }),
  })
}

// ---------------------------------------------------------------------------
// Excepciones (días especiales)
// ---------------------------------------------------------------------------

export function useExcepciones() {
  return useQuery({
    queryKey: claves.excepciones,
    queryFn: async (): Promise<Excepcion[]> => {
      const hoy = new Date().toISOString().slice(0, 10)
      const { data, error } = await supabase
        .from('disponibilidad_excepcion')
        .select('*')
        .gte('fecha', hoy)
        .order('fecha')
      if (error) throw error
      return data
    },
  })
}

export function useCrearExcepcion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (entrada: TablesInsert<'disponibilidad_excepcion'>) => {
      const { error } = await supabase.from('disponibilidad_excepcion').insert(entrada)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: claves.excepciones })
      qc.invalidateQueries({ queryKey: claves.clases })
    },
  })
}

export function useEliminarExcepcion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('disponibilidad_excepcion')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: claves.excepciones }),
  })
}
