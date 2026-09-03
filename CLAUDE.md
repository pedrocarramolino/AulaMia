# AulaMia — notas para trabajar en el repo

Agenda y planificador de clases de repaso. Usuario único (un profesor particular).
Interfaz **siempre en español**, fechas **DD/MM/AAAA**, semana **empieza en lunes**.

## Arquitectura

El plano completo está en `docs/ARQUITECTURA.md` y manda: modelo de datos, pantallas,
navegación, lógica y hoja de ruta por fases. Consúltalo antes de añadir tablas o
pantallas.

## Stack y convenciones

- **React 19 + Vite + TypeScript**, alias `@/` → `src/`.
- **Tailwind v4** (`@theme inline` en `src/index.css`). Colores por token semántico:
  `bg-ground`, `bg-surface`, `text-ink`, `text-muted`, `border-line`, `text-accent`,
  `bg-accent-soft`, y `good` / `warn` / `crit` para estados. Nunca hex sueltos.
- **Tema** claro/oscuro/sistema vía `data-theme` en `<html>` + `src/lib/tema.ts`.
- **Fechas**: usa siempre los helpers de `src/lib/fechas.ts` (locale `es`, lunes).
- **Datos**: Supabase con `src/lib/supabase.ts`; tipos en `src/lib/database.types.ts`.
  Envolver las lecturas/escrituras en TanStack Query.
- **Nombres en español** para tablas, columnas, componentes de dominio y rutas.
- Código nuevo: sin comentarios triviales, seguir el estilo del que rodea.

## Base de datos

- Proyecto Supabase: `gudvgxzraisolcpwprlz` (usa las herramientas MCP de Supabase).
- DDL → `apply_migration` **y** guarda el `.sql` en `supabase/migrations/` con el mismo
  nombre. Tras cambios de esquema: regenerar tipos y pasar `get_advisors`.
- Toda tabla nueva: columna `user_id uuid not null default auth.uid()` + RLS
  `for all using (user_id = auth.uid())` (patrón de `20260903000005_rls.sql`).

## Entorno

- Node vive en `~/.local/node/bin` (no hay Homebrew). El dev server se lanza con
  `.claude/launch.json` invocando el binario `node` directo sobre `vite`.
- `npm run build` hace typecheck completo; déjalo en verde antes de cerrar una fase.

## Vista previa sin sesión (solo desarrollo)

`RutaProtegida` deja pasar sin login si `localStorage['aulamia:preview'] === '1'`
**y** `import.meta.env.DEV`. Sirve para revisar el diseño; las escrituras fallan por
RLS. En producción el código se elimina en el build.

## Motor de clases (Fase 03)

- `horario_recurrente` = patrón; `clase` = sesiones materializadas (horizonte 8 sem.).
- `app.generar_clases_para(uuid, int)` (SECURITY DEFINER, esquema `app` no expuesto)
  hace el trabajo. `public.generar_mis_clases()` es el RPC del cliente (lo llama
  `useSincronizarClasesAlEntrar` al abrir la app).
- Triggers en `horario_recurrente` (`app.resembrar_horario`): al crear/editar/borrar
  un horario, borra las clases futuras `programada` y `not modificada` de esa serie
  y regenera. No toca las pasadas ni las modificadas.
- `pg_cron` job `generar-clases-diario` (03:15) regenera para todos los usuarios.
- El solape de clases lo impide la constraint `clase_sin_solape` (SQLSTATE 23P01);
  hay que traducirlo a mensaje amable en la UI (pendiente para Fase 04).

## Agenda (Fase 04)

- `src/features/agenda/`. Rejilla de tiempo propia (`rejilla.ts` + `componentes.tsx`),
  vistas en `vistas.tsx`, página con estado en la URL (`?v=` / `?f=`).
- Acciones de clase = RPCs SECURITY INVOKER que actualizan + auditan en `cambio_clase`
  en una transacción: `cancelar_clase`, `mover_clase`, `recuperar_clase`,
  `reactivar_clase`. "Marcar realizada" / editar notas/precio = update directo.
- "Toda la serie" en cancelar/mover = editar/pausar el `horario_recurrente`
  (dispara la resiembra del motor).
- `mensajeErrorClase()` traduce la constraint de solape (23P01) a texto amable.

## Estado

- Fases 01–06 ✓. `src/features/examenes/` (CRUD + generador de plan en `generador.ts`,
  pura). `src/features/panel/PaginaHoy.tsx` compone hooks de agenda/examenes/
  disponibilidad para el panel. Ficha del alumno = 5 pestañas.
- Siguiente: **Fase 07 — Planificador inteligente, recordatorios/push y estadísticas**.
