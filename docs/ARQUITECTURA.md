# Arquitectura de AulaMia

> Plano de producto v1 · 03/09/2026
> Agenda y planificador inteligente de clases de repaso.
> Versión visual para revisar: https://claude.ai/code/artifact/0fa51a5d-0945-4e94-805b-e538fb305837

---

## 1. Objetivo y principios

AulaMia responde en menos de 5 segundos y desde el móvil: **qué niños vienen hoy,
a qué hora, qué materia, qué repasar con cada uno y qué exámenes se acercan.**

Principios:

- **Simplicidad primero.** Flujo principal en pocos toques (alumno → horario →
  materias → exámenes → la app genera las sesiones).
- **Visual y por colores.** Cada alumno tiene un color usado en todas las vistas.
- **La agenda no se pierde.** Cancelar no borra; queda en el historial. Guardado
  automático siempre.
- **Recurrente pero flexible.** Los horarios habituales generan sesiones; cualquier
  clase suelta se modifica sin tocar la serie.
- **Móvil y escritorio.** Misma app, navegación inferior en móvil / lateral en PC.
- **Preparada para crecer.** Pagos, familias, exportaciones e IA previstos, no
  construidos aún.

---

## 2. Stack técnico

**Frontend**

- React + Vite + TypeScript (SPA)
- PWA (`vite-plugin-pwa`) — instalable, cascarón offline
- React Router
- TanStack Query (estado de servidor)
- Tailwind CSS (tema claro/oscuro)
- date-fns con locale `es` (DD/MM/AAAA, semana en lunes)
- FullCalendar o rejilla propia (día / semana / mes)

**Backend — Supabase**

- Postgres (todas las entidades)
- Auth por email (magic link o contraseña) — un solo profesor
- Row Level Security con `user_id` en todas las tablas (abre la puerta a multiusuario)
- Edge Functions (generación de sesiones, recordatorios, planificación inteligente)
- `pg_cron` (materializar sesiones, disparar avisos)
- Realtime (agenda sincronizada entre dispositivos)

**Infra**

- Despliegue continuo en Vercel desde el repo
- Guardado automático en cada cambio
- Copias de seguridad: diarias de Supabase + exportación/importación JSON manual

---

## 3. Modelo de datos

Centro = `alumno`. De él cuelgan materias, horario recurrente, clases, exámenes,
historial.

### Núcleo

**alumno** — `id` PK · `user_id` FK · `nombre` · `apellidos` · `fecha_nacimiento`
(la edad se calcula) · `curso` · `nivel` · `observaciones` · `color` (hex, único) ·
`precio_hora` (opcional) · `prioridad` (1–3, peso en planificación) · `activo` ·
`creado_en`

**materia** — `id` PK · `user_id` FK · `nombre` · `color` (opcional). Catálogo
reutilizable.

**alumno_materia** — `id` PK · `alumno_id` FK · `materia_id` FK · `nivel` ·
`dificultades` · `prioridad` (1–3) · `horas_recomendadas`

### Agenda

**horario_recurrente** — `id` PK · `alumno_id` FK · `materia_id` FK (opcional) ·
`dia_semana` (1=lunes) · `hora_inicio` · `duracion_min` · `vigente_desde` ·
`vigente_hasta` (nulo = indefinido) · `precio` (opcional, sobrescribe) · `activo`

**clase** (sesión materializada) — `id` PK · `user_id` FK · `alumno_id` FK ·
`materia_id` FK · `horario_recurrente_id` FK (nulo si suelta/extraordinaria) ·
`fecha` · `hora_inicio` · `hora_fin` ·
`estado` enum (`programada` | `realizada` | `cancelada` | `aplazada` |
`pendiente_recuperar`) ·
`origen` enum (`recurrente` | `manual` | `recuperacion` | `extraordinaria`) ·
`modificada` bool (editada respecto al patrón; la regeneración no la toca) ·
`recupera_a_clase_id` FK autorreferencia (qué clase cancelada recupera) ·
`precio` · `cobrada` bool · `notas_profesor` · `creado_en` · `actualizado_en`

**plan_sesion** (1:1 con clase) — `id` PK · `clase_id` FK único · `tema` ·
`contenido` · `objetivo` · `deberes_casa` · `examen_id` FK (opcional) ·
`nivel_progreso` (1–5) · `notas`

**tarea** — `id` PK · `alumno_id` FK · `clase_id` FK (opcional) · `materia_id` FK
(opcional) · `descripcion` · `tipo` enum (`en_clase` | `deberes`) · `completada` ·
`fecha_limite` (opcional)

**cambio_clase** (auditoría) — `id` PK · `clase_id` FK · `tipo` enum (`cancelada` |
`cambio_fecha` | `cambio_hora` | `cambio_duracion` | `recuperada` | `reactivada`) ·
`valor_anterior` jsonb · `valor_nuevo` jsonb · `motivo` · `creado_en`

### Exámenes

**examen** — `id` PK · `user_id` FK · `alumno_id` FK · `materia_id` FK · `titulo` ·
`fecha` · `temario` · `nivel_preparacion` (1–5) · `notas`.
`dias_restantes` se calcula en consulta (`fecha − hoy`), no se almacena.

**plan_examen** (repartos de repaso) — `id` PK · `examen_id` FK · `fecha` ·
`descripcion` · `clase_id` FK (opcional, si se asignó) · `completado`

### Disponibilidad y sistema

**disponibilidad** — `id` PK · `user_id` FK · `dia_semana` (1–7) · `hora_inicio` ·
`hora_fin`

**disponibilidad_excepcion** — `id` PK · `user_id` FK · `fecha` · `tipo` enum
(`bloqueo` | `extra`) · `hora_inicio` · `hora_fin` (opcional) · `motivo`

**recordatorio** — `id` PK · `user_id` FK · `tipo` enum (`clase` | `examen` |
`inactividad` | `recuperacion`) · `ref_tipo` · `ref_id` · `antelacion_min` ·
`dispara_en` · `estado` enum (`pendiente` | `enviado` | `visto`)

**nota** — `id` PK · `user_id` FK · `alumno_id` FK (opcional) · `clase_id` FK
(opcional) · `texto` · `creado_en`

**perfil** — nombre, email y preferencias del profesor (1 fila).

Tablas previstas y sin construir: `pago`, `factura`, `contacto_familia`, `mensaje`.

---

## 4. Navegación

Cinco destinos fijos. Móvil: barra inferior. Escritorio: barra lateral.

| Destino   | Ruta                          | Contiene                                                              |
|-----------|-------------------------------|----------------------------------------------------------------------|
| Hoy       | `/`                           | Panel principal. Pantalla de arranque.                               |
| Agenda    | `/agenda`                     | Vistas día / semana / mes · filtros · detalle de clase.              |
| Alumnos   | `/alumnos` → `/alumnos/:id`   | Lista · ficha (datos, materias, horario, historial, stats, exámenes).|
| Exámenes  | `/examenes` → `/examenes/:id` | Lista por fecha · detalle con plan de repaso.                        |
| Más       | `/mas`                        | Planificador · Disponibilidad · Estadísticas · Materias · Ajustes.   |

Superpuestas (no destinos): detalle de clase, editores (alumno/examen/clase/horario),
asistente de alta (7 pasos), acceso (`/acceso`).

---

## 5. Pantallas

- **Hoy / Panel** — HOY (nº clases, próxima clase con cuenta atrás, niños, materias,
  horas libres) · PRÓXIMOS DÍAS · ALERTAS (exámenes cercanos, conflictos, sin
  recuperar, alumnos con días sin repasar una materia).
- **Agenda — Día** — día por horas; cada franja Libre o bloque de color con materia
  y duración. Pulsación larga en franja libre = crear clase.
- **Agenda — Semana** — L–D en columnas, horas en filas, bloques de color;
  arrastrar para mover, tirar del borde para cambiar duración; conflictos en rojo.
- **Agenda — Mes** — rejilla mensual (semana en lunes); carga por día con puntos de
  color; seleccionar día lista clases + exámenes.
- **Detalle de clase** — alumno, materia, hora, tema, objetivo, tareas, próximo
  examen, notas. Acciones: editar · cancelar · cambiar horario · añadir notas ·
  marcar realizada · crear próxima sesión · añadir tarea. "Solo esta clase" vs
  "toda la serie".
- **Alumnos — Lista** — tarjetas con color, nombre, curso, próxima clase, aviso de
  examen. Buscador. Botón grande "Nuevo alumno" (lanza asistente).
- **Ficha de alumno** — pestañas Datos · Materias · Horario · Historial · Exámenes ·
  Estadísticas.
- **Exámenes — Lista** — por fecha con días restantes y barra de preparación;
  filtro por alumno/materia.
- **Detalle de examen** — datos + plan de repaso (repartos por fecha asignables a
  clases). "Generar plan" reparte el temario hasta la fecha.
- **Planificador inteligente** — sugerencias de reparto; se aceptan una a una o
  todas; nada se crea sin confirmar.
- **Disponibilidad** — rejilla semanal para pintar horas de trabajo + excepciones.
- **Estadísticas** — por alumno y generales, con gráficas simples y selector de
  periodo.
- **Materias** — catálogo editable.
- **Ajustes** — recordatorios, copia de seguridad (export/import JSON), cuenta,
  idioma.

---

## 6. Lógica del sistema

### Motor de recurrencia

- `horario_recurrente` = patrón; `clase` = sesiones reales materializadas a **8
  semanas**.
- **Generación**: Edge Function recorre horarios activos y crea las clases que
  falten. `pg_cron` diario + al abrir la app.
- **Editar una sesión**: se modifica la fila `clase`, `modificada = true`. La
  regeneración no la sobrescribe.
- **Editar la serie**: se cambia el `horario_recurrente`; se regeneran las clases
  futuras no modificadas.
- **Terminar la serie**: `vigente_hasta` o `activo = false`; se borran las futuras
  no modificadas.

### Disponibilidad y conflictos

- Al crear/mover clase se valida contra `disponibilidad` (± excepciones) y contra
  las demás clases.
- Solapamiento con clase no cancelada → se bloquea el guardado.
- Fuera de disponibilidad → aviso, pero se permite forzar (extraordinaria).
- Regla en Postgres (constraint de exclusión por rango horario) + en cliente para
  feedback inmediato.

### Planificación inteligente

`prioridad = f(cercanía de examen, días sin repasar la materia, nivel de
preparación, prioridad del alumno, horas recomendadas de la materia)`

- Examen cercano dispara la prioridad de ese alumno/materia.
- Coloca sugerencias en huecos libres dentro de la disponibilidad, respetando el
  horario habitual y sin conflictos.
- Devuelve propuestas; el profesor acepta/ajusta/descarta. Nunca escribe sin
  confirmación.

### Plan de examen

Desde un examen, "Generar plan" reparte el temario entre hoy y la fecha (repasos
por tema, ejercicios, simulacro, repaso final) según las clases disponibles con ese
alumno. Cada reparto se engancha a una clase (rellena su `plan_sesion`).

### Recordatorios y alertas

- Reglas configurables generan filas en `recordatorio` con `dispara_en`.
- `pg_cron` revisa vencidos → Web Push + bloque ALERTAS del panel.
- Tipos: 30 min antes de clase · 7 y 3 días antes de examen · alumno con X días sin
  repasar una materia · clase pendiente de recuperar.

### Filtros

Agenda y listados comparten: alumno · materia · estado · rango. Se aplican como
parámetros de consulta a Postgres.

---

## 7. Flujo principal (asistente de alta)

1. Crear alumno (nombre, curso, color, prioridad).
2. Introducir su horario habitual (día + hora + duración, uno o varios).
3. Añadir materias (catálogo o nuevas; nivel y dificultades).
4. Añadir próximos exámenes (materia, fecha, temario).
5. La app genera las sesiones (materializa 8 semanas).
6. Ajustar el calendario (mover, cancelar, clases sueltas).
7. Consultar cada día en el panel.

---

## 8. Hoja de ruta

| Fase | Nombre | Entrega |
|------|--------|---------|
| 01 | Fundamentos | Repo React+Vite+Tailwind+PWA. Supabase: esquema completo con migraciones, RLS, tipos. Auth por email. Layout con navegación, tema claro/oscuro, locale ES, semana en lunes. → *se entra y se navega entre las 5 secciones vacías.* |
| 02 | Alumnos | Catálogo de materias. CRUD ficha de alumno con color y prioridad. Asignación de materias. Lista con buscador. → *alta de niños reales con materias.* |
| 03 | Horarios | Editor de disponibilidad + excepciones. CRUD horarios recurrentes. Edge Function + `pg_cron` que materializa 8 semanas. Constraint de exclusión horaria. → *los horarios habituales rellenan el calendario solos.* |
| 04 | Agenda | Vistas día/semana/mes con bloques de color. Detalle de clase con todas las acciones. Cancelar/mover/duración/recuperar/duplicar/extraordinaria; "esta clase" vs "serie". Auditoría `cambio_clase`. Conflictos en vivo. Filtros. → *agenda gestionable desde el móvil.* |
| 05 | Repaso | `plan_sesion` en el detalle de clase. Tareas por clase y alumno. Historial en la ficha. → *cada clase lleva escrito qué se trabaja.* |
| 06 | Exámenes | CRUD exámenes con días restantes y preparación. Generador de plan de repaso. Panel principal completo (HOY / PRÓXIMOS DÍAS / ALERTAS). → *en 5 s sé qué hacer hoy.* |
| 07 | Inteligencia | Motor de prioridad y sugerencias. Reglas de recordatorio + Web Push + `pg_cron`. Estadísticas por alumno y generales. → *la app propone el plan de la semana y avisa.* |
| 08 | Cierre | Cascarón offline PWA, export/import JSON, accesibilidad, estados vacíos, rendimiento. Repaso del flujo de la sección 7. → *lista para el día a día, datos a salvo.* |

---

## 9. Preparado para el futuro

Ya previsto en el modelo:

- **Pagos y facturas** — `clase.precio` / `cobrada` + tablas `pago`, `factura`.
- **Comunicación con familias** — `contacto_familia`, `mensaje`.
- **Multiusuario** — `user_id` + RLS ya en todas las tablas.
- **Informes de evolución** — `nivel_progreso` histórico por sesión.

Puntos de extensión:

- Exportar a PDF / Excel desde estadísticas e historial.
- Sincronización con Google Calendar (Edge Function sobre `clase`).
- App móvil nativa (la PWA cubre el caso; envoltorio si hace falta).
- IA para preparar sesiones y generar ejercicios a partir del temario.
