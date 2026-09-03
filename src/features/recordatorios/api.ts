import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { claves } from '@/lib/claves'
import { useAuth } from '@/auth/AuthProvider'
import type { Tables } from '@/lib/database.types'

export type Recordatorio = Tables<'recordatorio'>

export interface Preferencias {
  clase_antelacion_min: number
  examen_dias: number[]
  avisar_recuperaciones: boolean
}

const PREF_DEFECTO: Preferencias = {
  clase_antelacion_min: 30,
  examen_dias: [7, 3],
  avisar_recuperaciones: true,
}

// ---------------------------------------------------------------------------
// Recordatorios activos (vencidos y sin ver)
// ---------------------------------------------------------------------------

export function useRecordatoriosActivos() {
  return useQuery({
    queryKey: claves.recordatorios,
    queryFn: async (): Promise<Recordatorio[]> => {
      const { data, error } = await supabase
        .from('recordatorio')
        .select('*')
        .lte('dispara_en', new Date().toISOString())
        .neq('estado', 'visto')
        .order('dispara_en', { ascending: false })
      if (error) throw error
      return data
    },
    refetchInterval: 5 * 60 * 1000,
  })
}

export function useMarcarVisto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recordatorio')
        .update({ estado: 'visto' })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: claves.recordatorios }),
  })
}

export function useMarcarTodosVistos() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('recordatorio')
        .update({ estado: 'visto' })
        .in('id', ids)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: claves.recordatorios }),
  })
}

// ---------------------------------------------------------------------------
// Generación (al abrir la app)
// ---------------------------------------------------------------------------

let yaGenerado = false

export function useGenerarRecordatoriosAlEntrar() {
  const { session } = useAuth()
  const qc = useQueryClient()

  useEffect(() => {
    if (!session || yaGenerado) return
    yaGenerado = true
    supabase.rpc('generar_mis_recordatorios').then(() => {
      qc.invalidateQueries({ queryKey: claves.recordatorios })
    })
  }, [session, qc])
}

// ---------------------------------------------------------------------------
// Preferencias de recordatorios (perfil.preferencias)
// ---------------------------------------------------------------------------

export function usePreferencias() {
  return useQuery({
    queryKey: claves.preferencias,
    queryFn: async (): Promise<Preferencias> => {
      const { data, error } = await supabase
        .from('perfil')
        .select('preferencias')
        .single()
      if (error) throw error
      return { ...PREF_DEFECTO, ...((data.preferencias as Partial<Preferencias>) ?? {}) }
    },
  })
}

export function useGuardarPreferencias() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (parcial: Partial<Preferencias>) => {
      const actual = qc.getQueryData<Preferencias>(claves.preferencias) ?? PREF_DEFECTO
      const { data: sesion } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('perfil')
        .update({ preferencias: { ...actual, ...parcial } })
        .eq('id', sesion.user!.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: claves.preferencias }),
  })
}
