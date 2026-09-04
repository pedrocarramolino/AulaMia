import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/auth/AuthProvider'
import { RutaProtegida } from '@/components/RutaProtegida'
import { AppLayout } from '@/components/AppLayout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Cargando } from '@/components/ui'
import { Acceso } from '@/pages/Acceso'
import { NuevaContrasena } from '@/pages/NuevaContrasena'

const PaginaHoy = lazy(() =>
  import('@/features/panel/PaginaHoy').then((m) => ({ default: m.PaginaHoy })),
)
const PaginaAgenda = lazy(() =>
  import('@/features/agenda/PaginaAgenda').then((m) => ({ default: m.PaginaAgenda })),
)
const PaginaClase = lazy(() =>
  import('@/features/agenda/PaginaClase').then((m) => ({ default: m.PaginaClase })),
)
const EditorClase = lazy(() =>
  import('@/features/agenda/EditorClase').then((m) => ({ default: m.EditorClase })),
)
const PaginaListaAlumnos = lazy(() =>
  import('@/features/alumnos/PaginaListaAlumnos').then((m) => ({ default: m.PaginaListaAlumnos })),
)
const PaginaEditorAlumno = lazy(() =>
  import('@/features/alumnos/PaginaEditorAlumno').then((m) => ({ default: m.PaginaEditorAlumno })),
)
const PaginaFichaAlumno = lazy(() =>
  import('@/features/alumnos/PaginaFichaAlumno').then((m) => ({ default: m.PaginaFichaAlumno })),
)
const PaginaExamenes = lazy(() =>
  import('@/features/examenes/PaginaExamenes').then((m) => ({ default: m.PaginaExamenes })),
)
const PaginaExamen = lazy(() =>
  import('@/features/examenes/PaginaExamen').then((m) => ({ default: m.PaginaExamen })),
)
const EditorExamen = lazy(() =>
  import('@/features/examenes/EditorExamen').then((m) => ({ default: m.EditorExamen })),
)
const PaginaMaterias = lazy(() =>
  import('@/features/materias/PaginaMaterias').then((m) => ({ default: m.PaginaMaterias })),
)
const PaginaDisponibilidad = lazy(() =>
  import('@/features/disponibilidad/PaginaDisponibilidad').then((m) => ({
    default: m.PaginaDisponibilidad,
  })),
)
const PaginaPlanificador = lazy(() =>
  import('@/features/planificador/PaginaPlanificador').then((m) => ({
    default: m.PaginaPlanificador,
  })),
)
const PaginaEstadisticas = lazy(() =>
  import('@/features/estadisticas/PaginaEstadisticas').then((m) => ({
    default: m.PaginaEstadisticas,
  })),
)
const Mas = lazy(() => import('@/pages/Mas').then((m) => ({ default: m.Mas })))
const Ajustes = lazy(() => import('@/pages/Ajustes').then((m) => ({ default: m.Ajustes })))

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <Suspense fallback={<Cargando />}>
            <Routes>
              <Route path="/acceso" element={<Acceso />} />
              <Route path="/nueva-contrasena" element={<NuevaContrasena />} />

              <Route
                element={
                  <RutaProtegida>
                    <AppLayout />
                  </RutaProtegida>
                }
              >
                <Route index element={<PaginaHoy />} />

                <Route path="agenda">
                  <Route index element={<PaginaAgenda />} />
                  <Route path="nueva" element={<EditorClase />} />
                  <Route path="clase/:id" element={<PaginaClase />} />
                  <Route path="clase/:id/editar" element={<EditorClase />} />
                </Route>

                <Route path="alumnos">
                  <Route index element={<PaginaListaAlumnos />} />
                  <Route path="nuevo" element={<PaginaEditorAlumno />} />
                  <Route path=":id" element={<PaginaFichaAlumno />} />
                  <Route path=":id/editar" element={<PaginaEditorAlumno />} />
                </Route>

                <Route path="examenes">
                  <Route index element={<PaginaExamenes />} />
                  <Route path="nuevo" element={<EditorExamen />} />
                  <Route path=":id" element={<PaginaExamen />} />
                  <Route path=":id/editar" element={<EditorExamen />} />
                </Route>

                <Route path="mas">
                  <Route index element={<Mas />} />
                  <Route path="ajustes" element={<Ajustes />} />
                  <Route path="materias" element={<PaginaMaterias />} />
                  <Route path="disponibilidad" element={<PaginaDisponibilidad />} />
                  <Route path="planificador" element={<PaginaPlanificador />} />
                  <Route path="estadisticas" element={<PaginaEstadisticas />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
