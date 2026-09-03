import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/auth/AuthProvider'
import { RutaProtegida } from '@/components/RutaProtegida'
import { AppLayout } from '@/components/AppLayout'
import { Acceso } from '@/pages/Acceso'
import { Hoy } from '@/pages/Hoy'
import { Examenes } from '@/pages/Examenes'
import { Mas } from '@/pages/Mas'
import { Ajustes } from '@/pages/Ajustes'
import { Proximamente } from '@/pages/Proximamente'
import { PaginaListaAlumnos } from '@/features/alumnos/PaginaListaAlumnos'
import { PaginaEditorAlumno } from '@/features/alumnos/PaginaEditorAlumno'
import { PaginaFichaAlumno } from '@/features/alumnos/PaginaFichaAlumno'
import { PaginaMaterias } from '@/features/materias/PaginaMaterias'
import { PaginaDisponibilidad } from '@/features/disponibilidad/PaginaDisponibilidad'
import { PaginaAgenda } from '@/features/agenda/PaginaAgenda'
import { PaginaClase } from '@/features/agenda/PaginaClase'
import { EditorClase } from '@/features/agenda/EditorClase'

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
            <Route index element={<Hoy />} />

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

            <Route path="examenes" element={<Examenes />} />

            <Route path="mas">
              <Route index element={<Mas />} />
              <Route path="ajustes" element={<Ajustes />} />
              <Route path="materias" element={<PaginaMaterias />} />
              <Route path="disponibilidad" element={<PaginaDisponibilidad />} />
              <Route
                path="planificador"
                element={
                  <Proximamente
                    titulo="Planificador inteligente"
                    fase="Fase 07"
                    texto="Propone cómo repartir los repasos según tu disponibilidad, los exámenes próximos y la prioridad de cada alumno."
                  />
                }
              />
              <Route
                path="estadisticas"
                element={
                  <Proximamente
                    titulo="Estadísticas"
                    fase="Fase 07"
                    texto="Horas impartidas, clases realizadas y canceladas, evolución de cada alumno y resumen de tu semana y tu mes."
                  />
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
