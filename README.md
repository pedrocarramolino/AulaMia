# AulaMia

Agenda y planificador inteligente de clases de repaso. Web + PWA instalable en móvil
y escritorio.

- **Plano de producto:** [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md)
- **Stack:** React 19 · Vite · TypeScript · Tailwind CSS v4 · React Router · TanStack
  Query · Supabase (Postgres + Auth) · PWA

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # rellena URL y clave del proyecto Supabase
npm run dev                   # http://localhost:3000
```

> El puerto es 3000 a propósito: coincide con la *Site URL* por defecto de Supabase,
> así los enlaces mágicos de acceso funcionan en local sin configurar nada más.

## Scripts

| Comando          | Qué hace                                          |
|------------------|--------------------------------------------------|
| `npm run dev`    | Servidor de desarrollo                            |
| `npm run build`  | Comprobación de tipos + build de producción       |
| `npm run preview`| Sirve el build de `dist/`                         |
| `npm run lint`   | oxlint                                            |
| `npm run types`  | Regenera `src/lib/database.types.ts` (Supabase CLI)|

## Base de datos

Proyecto Supabase **AulaMia** (`gudvgxzraisolcpwprlz`, región `eu-west-3`).
Las migraciones viven en [`supabase/migrations/`](supabase/migrations/) y ya están
aplicadas en remoto. Todas las tablas tienen RLS: cada usuario solo ve sus filas.

## Estado

Fase 01 (Fundamentos) completada: proyecto, esquema completo, acceso por correo,
navegación, tema claro/oscuro, español y semana en lunes. Ver la hoja de ruta en
`docs/ARQUITECTURA.md` §8.
