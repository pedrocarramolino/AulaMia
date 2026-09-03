-- AulaMia · Fase 08 · Web Push
--
-- app_config: fila única con las claves VAPID y un secreto para el cron.
-- Sin políticas RLS -> solo el service_role (Edge Function) puede leerla.

create extension if not exists pg_net;

create table app_config (
  id            text primary key default 'global',
  vapid_public  text not null,
  vapid_private text not null,
  vapid_subject text not null default 'mailto:aulamia@example.com',
  cron_secret   text not null default gen_random_uuid()::text
);

alter table app_config enable row level security;
-- (ninguna política: inaccesible para anon y authenticated)

-- Las claves VAPID reales se insertaron a mano en el proyecto remoto y NO van al
-- repo. Para un despliegue nuevo: genera un par con `npx web-push generate-vapid-keys`
-- y ejecuta el insert con tus valores. La pública va también en VITE_VAPID_PUBLIC_KEY.
insert into app_config (id, vapid_public, vapid_private)
values ('global', 'TU_VAPID_PUBLIC', 'TU_VAPID_PRIVATE')
on conflict (id) do nothing;

-- Invoca el Edge Function cada 5 minutos para enviar los recordatorios vencidos.
select cron.schedule(
  'enviar-recordatorios',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://gudvgxzraisolcpwprlz.supabase.co/functions/v1/enviar-recordatorios',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select cron_secret from app_config where id = 'global')
    ),
    body := '{}'::jsonb
  );
  $$
);
