import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/auth/AuthProvider'
import { RutaProtegida } from '@/components/RutaProtegida'
import { AppLayout } from '@/components/AppLayout'
import { Acceso } from '@/pages/Acceso'
import { Mas } from '@/pages/Mas'
import { Ajustes } from '@/pages/Ajustes'
import { PaginaListaAlumnos } from '@/features/alumnos/PaginaListaAlumnos'
import { PaginaEditorAlumno } from '@/features/alumnos/PaginaEditorAlumno'
import { PaginaFichaAlumno } from '@/features/alumnos/PaginaFichaAlumno'
import { PaginaMaterias } from '@/features/materias/PaginaMaterias'
import { PaginaDisponibilidad } from '@/features/disponibilidad/PaginaDisponibilidad'
import { PaginaAgenda } from '@/features/agenda/PaginaAgenda'
import { PaginaClase } from '@/features/agenda/PaginaClase'
import { EditorClase } from '@/features/agenda/EditorClase'
import { PaginaHoy } from '@/features/panel/PaginaHoy'
import { PaginaExamenes } from '@/features/examenes/PaginaExamenes'
import { PaginaExamen } from '@/features/examenes/PaginaExamen'
import { EditorExamen } from '@/features/examenes/EditorExamen'
import { PaginaPlanificador } from '@/features/planificador/PaginaPlanificador'
import { PaginaEstadisticas } from '@/features/estadisticas/PaginaEstadisticas'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/acceso" element={<Acceso />} />

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
      </AuthProvider>
    </BrowserRouter>
  )
}
