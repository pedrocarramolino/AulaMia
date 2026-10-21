-- AulaMia · Reactiva el envío de notificaciones push
--
-- Ningún push había salido nunca: el cron llamaba a `extensions.http_post`,
-- que no existe (pg_net vive en el esquema `net`), y fallaba cada 5 min.

-- ---------------------------------------------------------------------------
-- Los avisos pendientes que ya existían se calcularon en UTC: se rehacen.
-- ---------------------------------------------------------------------------
select app.resincronizar_recordatorios(id) from auth.users;

-- ---------------------------------------------------------------------------
-- Envío de push: `net.http_post`, que es donde vive pg_net. La Edge Function
-- solo manda los avisos de los últimos 30 min, así que al arrancar no dispara
-- los atrasados que se acumularon mientras esto fallaba.
-- ---------------------------------------------------------------------------
select cron.unschedule('enviar-recordatorios');
select cron.schedule(
  'enviar-recordatorios',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://gudvgxzraisolcpwprlz.supabase.co/functions/v1/enviar-recordatorios',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select cron_secret from app.app_config where id = 'global')
    ),
    body := '{}'::jsonb
  );
  $$
);
