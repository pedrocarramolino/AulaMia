-- AulaMia · Fase 08 · Mover app_config al esquema `app` (no expuesto por la API)

alter table public.app_config disable row level security;
alter table public.app_config set schema app;

select cron.unschedule('enviar-recordatorios');
select cron.schedule(
  'enviar-recordatorios',
  '*/5 * * * *',
  $$
  select extensions.http_post(
    url := 'https://gudvgxzraisolcpwprlz.supabase.co/functions/v1/enviar-recordatorios',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select cron_secret from app.app_config where id = 'global')
    ),
    body := '{}'::jsonb
  );
  $$
);
