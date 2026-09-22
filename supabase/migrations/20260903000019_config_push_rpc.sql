-- AulaMia · Fase 08 · RPC para leer la configuración de Web Push
--
-- `app.app_config` vive en el esquema `app` (no expuesto por la API), así que la
-- Edge Function `enviar-recordatorios` no puede leerla directamente con PostgREST.
-- Este wrapper SECURITY DEFINER la devuelve, y solo `service_role` puede llamarlo:
-- ni `anon` ni `authenticated` llegan a las claves VAPID ni al `cron_secret`.

create or replace function public.config_push()
returns app.app_config
language sql
security definer
set search_path = app
as $$
  select * from app.app_config where id = 'global';
$$;

revoke execute on function public.config_push() from public;
revoke execute on function public.config_push() from anon, authenticated;
grant execute on function public.config_push() to service_role;
