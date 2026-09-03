-- AulaMia · Fase 07 · Generación de recordatorios
--
-- Las reglas viven en perfil.preferencias (JSON). El motor materializa filas en
-- `recordatorio`; la entrega in-app las lee y, más adelante, un Edge Function
-- enviará Web Push a partir de `push_subscription`.

-- Suscripciones de Web Push (una por dispositivo/navegador)
create table push_subscription (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint  text not null unique,
  p256dh    text not null,
  auth      text not null,
  creado_en timestamptz not null default now()
);

alter table push_subscription enable row level security;
create policy push_subscription_propietario on push_subscription
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Anti-duplicados para los recordatorios generados
create unique index recordatorio_unico
  on recordatorio (user_id, tipo, ref_id, antelacion_min);

-- ---------------------------------------------------------------------------
create or replace function app.generar_recordatorios(p_user uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_creados integer := 0;
  v_pref jsonb;
  v_clase_min int;
  v_examen_dias int[];
  v_recuperaciones boolean;
  d int;
  r record;
begin
  select coalesce(preferencias, '{}'::jsonb) into v_pref from perfil where id = p_user;
  v_clase_min := coalesce((v_pref ->> 'clase_antelacion_min')::int, 30);
  v_examen_dias := coalesce(
    (select array_agg(x::int) from jsonb_array_elements_text(v_pref -> 'examen_dias') x),
    array[7, 3]
  );
  v_recuperaciones := coalesce((v_pref ->> 'avisar_recuperaciones')::boolean, true);

  -- Clases de los próximos 7 días
  if v_clase_min > 0 then
    for r in
      select c.id, (c.fecha + c.hora_inicio) - make_interval(mins => v_clase_min) as cuando
      from clase c
      where c.user_id = p_user and c.estado = 'programada'
        and c.fecha between current_date and current_date + 7
    loop
      insert into recordatorio (user_id, tipo, ref_tipo, ref_id, antelacion_min, dispara_en, mensaje)
      values (p_user, 'clase', 'clase', r.id, v_clase_min, r.cuando, 'Clase en ' || v_clase_min || ' min')
      on conflict (user_id, tipo, ref_id, antelacion_min) do nothing;
      v_creados := v_creados + 1;
    end loop;
  end if;

  -- Exámenes próximos, un aviso por cada antelación configurada
  foreach d in array v_examen_dias loop
    for r in
      select e.id, e.titulo, (e.fecha - d) + time '09:00' as cuando
      from examen e
      where e.user_id = p_user
        and e.fecha - d >= current_date
        and e.fecha >= current_date
    loop
      insert into recordatorio (user_id, tipo, ref_tipo, ref_id, antelacion_min, dispara_en, mensaje)
      values (p_user, 'examen', 'examen', r.id, d * 1440, r.cuando,
              r.titulo || ' en ' || d || ' días')
      on conflict (user_id, tipo, ref_id, antelacion_min) do nothing;
      v_creados := v_creados + 1;
    end loop;
  end loop;

  -- Clases pendientes de recuperar (aviso inmediato, una vez)
  if v_recuperaciones then
    for r in
      select c.id from clase c
      where c.user_id = p_user and c.estado = 'pendiente_recuperar'
    loop
      insert into recordatorio (user_id, tipo, ref_tipo, ref_id, antelacion_min, dispara_en, mensaje)
      values (p_user, 'recuperacion', 'clase', r.id, 0, now(), 'Clase pendiente de recuperar')
      on conflict (user_id, tipo, ref_id, antelacion_min) do nothing;
      v_creados := v_creados + 1;
    end loop;
  end if;

  return v_creados;
end;
$$;

revoke execute on function app.generar_recordatorios(uuid) from public;
grant execute on function app.generar_recordatorios(uuid) to authenticated;

create or replace function public.generar_mis_recordatorios()
returns integer
language sql
security invoker
set search_path = public
as $$
  select app.generar_recordatorios(auth.uid());
$$;

grant execute on function public.generar_mis_recordatorios() to authenticated;

-- Tarea diaria
select cron.schedule(
  'generar-recordatorios-diario',
  '30 3 * * *',
  $$ select app.generar_recordatorios(id) from auth.users $$
);
