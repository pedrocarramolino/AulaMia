import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { claves } from '@/lib/claves'
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/database.types'
import type { Materia } from '@/features/materias/api'

export type Alumno = Tables<'alumno'>
export type AsignacionMateria = Tables<'alumno_materia'> & { materia: Materia }

// ---------------------------------------------------------------------------
// Alumnos
// ---------------------------------------------------------------------------

export function useAlumnos(incluirArchivados = false) {
  return useQuery({
    queryKey: [...claves.alumnos, { incluirArchivados }],
    queryFn: async (): Promise<Alumno[]> => {
      let q = supabase.from('alumno').select('*').order('nombre')
      if (!incluirArchivados) q = q.eq('activo', true)
      const { data, error } = await q
      if (error) throw error
      return data
    },
  })
}

export function useAlumno(id: string | undefined) {
  return useQuery({
    queryKey: claves.alumno(id ?? ''),
    enabled: !!id,
    queryFn: async (): Promise<Alumno> => {
      const { data, error } = await supabase
        .from('alumno')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data
    },
  })
}

export function useCrearAlumno() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (entrada: TablesInsert<'alumno'>): Promise<Alumno> => {
      const { data, error } = await supabase
        .from('alumno')
        .insert(entrada)
        .select('*')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: claves.alumnos }),
  })
}

export function useActualizarAlumno() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      cambios,
    }: {
      id: string
      cambios: TablesUpdate<'alumno'>
    }): Promise<Alumno> => {
      const { data, error } = await supabase
        .from('alumno')
        .update(cambios)
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (alumno) => {
      qc.invalidateQueries({ queryKey: claves.alumnos })
      qc.invalidateQueries({ queryKey: claves.alumno(alumno.id) })
    },
  })
}

/** Baja lógica: no borra el historial. */
export function useArchivarAlumno() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      const { error } = await supabase.from('alumno').update({ activo }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: claves.alumnos }),
  })
}

// ---------------------------------------------------------------------------
// Materias de un alumno
// ---------------------------------------------------------------------------

export function useMateriasDeAlumno(alumnoId: string | undefined) {
  return useQuery({
    queryKey: claves.materiasDeAlumno(alumnoId ?? ''),
    enabled: !!alumnoId,
    queryFn: async (): Promise<AsignacionMateria[]> => {
      const { data, error } = await supabase
        .from('alumno_materia')
        .select('*, materia:materia(*)')
        .eq('alumno_id', alumnoId!)
      if (error) throw error
      return (data as AsignacionMateria[]).sort((a, b) =>
        a.materia.nombre.localeCompare(b.materia.nombre),
      )
    },
  })
}

export function useAsignarMateria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (entrada: TablesInsert<'alumno_materia'>) => {
      const { error } = await supabase.from('alumno_materia').insert(entrada)
      if (error) throw error
    },
    onSuccess: (_d, entrada) =>
      qc.invalidateQueries({ queryKey: claves.materiasDeAlumno(entrada.alumno_id) }),
  })
}

export function useActualizarAsignacion(alumnoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      cambios,
    }: {
      id: string
      cambios: TablesUpdate<'alumno_materia'>
    }) => {
      const { error } = await supabase.from('alumno_materia').update(cambios).eq('id', id)
      if (error) throw error
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: claves.materiasDeAlumno(alumnoId) }),
  })
}

export function useQuitarMateria(alumnoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (asignacionId: string) => {
      const { error } = await supabase
        .from('alumno_materia')
        .delete()
        .eq('id', asignacionId)
      if (error) throw error
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: claves.materiasDeAlumno(alumnoId) }),
  })
}
