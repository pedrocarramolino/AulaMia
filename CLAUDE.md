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

## Estado

Fase 01 completa. Siguiente: **Fase 02 — Alumnos y materias**.
