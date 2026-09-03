/** Claves de caché de TanStack Query, centralizadas. */
export const claves = {
  materias: ['materias'] as const,
  alumnos: ['alumnos'] as const,
  alumno: (id: string) => ['alumno', id] as const,
  materiasDeAlumno: (alumnoId: string) => ['alumno', alumnoId, 'materias'] as const,
  horariosDeAlumno: (alumnoId: string) => ['alumno', alumnoId, 'horarios'] as const,
  disponibilidad: ['disponibilidad'] as const,
  excepciones: ['excepciones'] as const,
  clases: ['clases'] as const,
}
