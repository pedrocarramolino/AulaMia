import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/auth/AuthProvider'
import { RutaProtegida } from '@/components/RutaProtegida'
import { AppLayout } from '@/components/AppLayout'
import { Acceso } from '@/pages/Acceso'
import { Hoy } from '@/pages/Hoy'
import { Agenda } from '@/pages/Agenda'
import { Alumnos } from '@/pages/Alumnos'
import { Examenes } from '@/pages/Examenes'
import { Mas } from '@/pages/Mas'
import { Ajustes } from '@/pages/Ajustes'
import { Proximamente } from '@/pages/Proximamente'

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
            <Route path="agenda" element={<Agenda />} />
            <Route path="alumnos" element={<Alumnos />} />
            <Route path="examenes" element={<Examenes />} />

            <Route path="mas">
              <Route index element={<Mas />} />
              <Route path="ajustes" element={<Ajustes />} />
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
                path="disponibilidad"
                element={
                  <Proximamente
                    titulo="Disponibilidad"
                    fase="Fase 03"
                    texto="Marca tus horas de trabajo de cada día. La agenda impedirá crear clases fuera de ellas."
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
              <Route
                path="materias"
                element={
                  <Proximamente
                    titulo="Materias"
                    fase="Fase 02"
                    texto="Catálogo de materias reutilizables entre alumnos, con su color."
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
