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

Lógica en el servidor:

- Esquema `app` — funciones internas no expuestas por la API (motor de clases,
  recordatorios, importación).
- `pg_cron` — materializa clases (03:15), genera recordatorios (03:30), envía
  Web Push cada 5 min llamando al Edge Function `enviar-recordatorios`.
- Edge Function [`enviar-recordatorios`](supabase/functions/enviar-recordatorios/) —
  Web Push con `web-push` + VAPID. Las claves VAPID viven en `app.app_config`
  (solo `service_role`); la pública también en `VITE_VAPID_PUBLIC_KEY`.

## Despliegue

Despliegue en Vercel desde el repo. Variables de entorno en producción:
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY`.
Añade la URL de producción a *Auth → URL Configuration* en Supabase.

## Estado

Fases 01–08 completadas: la app está lista para el día a día. Ver la hoja de ruta
en `docs/ARQUITECTURA.md` §8.

- **Web Push** funciona sobre HTTPS con la PWA instalada; en local (`http://localhost`)
  el navegador limita las notificaciones.
- Los datos se pueden **exportar/importar en JSON** desde *Más → Ajustes*.
