import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { claves } from '@/lib/claves'
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/database.types'

type AlumnoMini = Pick<Tables<'alumno'>, 'id' | 'nombre' | 'apellidos' | 'color'>
type MateriaMini = Pick<Tables<'materia'>, 'id' | 'nombre' | 'color'>

export type ClaseAgenda = Tables<'clase'> & {
  alumno: AlumnoMini
  materia: MateriaMini | null
}

export type ClaseDetalle = ClaseAgenda & {
  horario_recurrente: Pick<Tables<'horario_recurrente'>, 'id' | 'dia_semana'> | null
}

export type CambioClase = Tables<'cambio_clase'>

export interface FiltrosAgenda {
  alumnoId?: string
  materiaId?: string
  incluirCanceladas?: boolean
}

const SELECT =
  '*, alumno:alumno(id, nombre, apellidos, color), materia:materia(id, nombre, color)'

/** Traduce errores de Postgres a mensajes para la profesora. */
export function mensajeErrorClase(error: unknown): string {
  const e = error as { message?: string }
  const msg = e?.message ?? ''
  if (msg.includes('disponibilidad')) return 'Esa hora queda fuera de tu disponibilidad.'
  return 'No se ha podido guardar el cambio. Inténtalo de nuevo.'
}

export function useClasesRango(
  desde: string,
  hasta: string,
  filtros: FiltrosAgenda = {},
) {
  return useQuery({
    queryKey: [...claves.clases, 'rango', desde, hasta, filtros],
    queryFn: async (): Promise<ClaseAgenda[]> => {
      let q = supabase
        .from('clase')
        .select(SELECT)
        .gte('fecha', desde)
        .lte('fecha', hasta)
        .order('fecha')
        .order('hora_inicio')

      if (filtros.alumnoId) q = q.eq('alumno_id', filtros.alumnoId)
      if (filtros.materiaId) q = q.eq('materia_id', filtros.materiaId)
      if (!filtros.incluirCanceladas) q = q.neq('estado', 'cancelada')

      const { data, error } = await q
      if (error) throw error
      return data as ClaseAgenda[]
    },
  })
}

export type ClaseHistorial = ClaseAgenda & {
  plan_sesion: { tema: string | null; nivel_progreso: number | null } | null
}

export function useClasesDeAlumno(alumnoId: string | undefined) {
  return useQuery({
    queryKey: claves.historialAlumno(alumnoId ?? ''),
    enabled: !!alumnoId,
    queryFn: async (): Promise<ClaseHistorial[]> => {
      const { data, error } = await supabase
        .from('clase')
        .select(`${SELECT}, plan_sesion:plan_sesion(tema, nivel_progreso)`)
        .eq('alumno_id', alumnoId!)
        .order('fecha', { ascending: false })
        .order('hora_inicio', { ascending: false })
      if (error) throw error
      return data as ClaseHistorial[]
    },
  })
}

export function useClasesPendientesRecuperar() {
  return useQuery({
    queryKey: [...claves.clases, 'pendientes-recuperar'],
    queryFn: async (): Promise<ClaseAgenda[]> => {
      const { data, error } = await supabase
        .from('clase')
        .select(SELECT)
        .eq('estado', 'pendiente_recuperar')
        .order('fecha')
      if (error) throw error
      return data as ClaseAgenda[]
    },
  })
}

export function useClase(id: string | undefined) {
  return useQuery({
    queryKey: [...claves.clases, 'detalle', id],
    enabled: !!id,
    queryFn: async (): Promise<ClaseDetalle> => {
      const { data, error } = await supabase
        .from('clase')
        .select(`${SELECT}, horario_recurrente:horario_recurrente(id, dia_semana)`)
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as ClaseDetalle
    },
  })
}

export function useCambiosDeClase(claseId: string | undefined) {
  return useQuery({
    queryKey: [...claves.clases, 'cambios', claseId],
    enabled: !!claseId,
    queryFn: async (): Promise<CambioClase[]> => {
      const { data, error } = await supabase
        .from('cambio_clase')
        .select('*')
        .eq('clase_id', claseId!)
        .order('creado_en', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

// ---------------------------------------------------------------------------
// Mutaciones
// ---------------------------------------------------------------------------

function invalidar(qc: ReturnType<typeof useQueryClient>, claseId?: string) {
  qc.invalidateQueries({ queryKey: claves.clases })
  if (claseId) {
    qc.invalidateQueries({ queryKey: [...claves.clases, 'detalle', claseId] })
    qc.invalidateQueries({ queryKey: [...claves.clases, 'cambios', claseId] })
  }
}

export function useCrearClase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (entrada: TablesInsert<'clase'>): Promise<ClaseAgenda> => {
      const { data, error } = await supabase
        .from('clase')
        .insert(entrada)
        .select(SELECT)
        .single()
      if (error) throw error
      return data as ClaseAgenda
    },
    onSuccess: () => invalidar(qc),
  })
}

export function useActualizarClase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      cambios,
    }: {
      id: string
      cambios: TablesUpdate<'clase'>
    }) => {
      const { error } = await supabase.from('clase').update(cambios).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_d, v) => invalidar(qc, v.id),
  })
}

export function useCancelarClase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      id: string
      motivo?: string
      pendienteRecuperar?: boolean
    }) => {
      const { error } = await supabase.rpc('cancelar_clase', {
        p_clase: args.id,
        p_motivo: args.motivo ?? undefined,
        p_pendiente_recuperar: args.pendienteRecuperar ?? false,
      })
      if (error) throw error
    },
    onSuccess: (_d, v) => invalidar(qc, v.id),
  })
}

export function useMoverClase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      id: string
      fecha: string
      horaInicio: string
      horaFin: string
      motivo?: string
    }) => {
      const { error } = await supabase.rpc('mover_clase', {
        p_clase: args.id,
        p_fecha: args.fecha,
        p_hora_inicio: args.horaInicio,
        p_hora_fin: args.horaFin,
        p_motivo: args.motivo ?? undefined,
      })
      if (error) throw error
    },
    onSuccess: (_d, v) => invalidar(qc, v.id),
  })
}

export function useRecuperarClase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      id: string
      fecha: string
      horaInicio: string
      horaFin: string
    }): Promise<string> => {
      const { data, error } = await supabase.rpc('recuperar_clase', {
        p_clase: args.id,
        p_fecha: args.fecha,
        p_hora_inicio: args.horaInicio,
        p_hora_fin: args.horaFin,
      })
      if (error) throw error
      return data as string
    },
    onSuccess: (_d, v) => invalidar(qc, v.id),
  })
}

export function useReactivarClase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('reactivar_clase', { p_clase: id })
      if (error) throw error
    },
    onSuccess: (_d, id) => invalidar(qc, id),
  })
}
