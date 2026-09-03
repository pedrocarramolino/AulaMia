-- AulaMia · Fase 03 · Tarea programada diaria del motor de clases
-- Además de generarse al abrir la app, las clases se materializan cada noche.

create extension if not exists pg_cron;

select cron.schedule(
  'generar-clases-diario',
  '15 3 * * *',
  $$ select app.generar_clases_para(id) from auth.users $$
);
