-- AulaMia · Avisos configurables por examen
--
-- Cada examen puede elegir cuántos días antes y a qué hora avisar; si no elige
-- nada, sigue lo que haya en Ajustes. De paso se corrigen cuatro fallos del
-- generador de recordatorios (el envío roto se arregla en la migración 23):
--
--   1. Las horas se calculaban en UTC aunque son hora de Madrid: el aviso de
--      una clase a las 17:30 saltaba a las 18:30 (en invierno), ya empezada.
--   2. Cambiar la fecha de un examen no movía sus avisos (`on conflict do
--      nothing` dejaba la fila vieja) y borrarlo no los quitaba.
--   3. Vaciar los días de examen en Ajustes volvía a [7, 3]: `array_agg` de
--      cero filas da NULL y el `coalesce` caía al valor por defecto.
--   4. Se programaban avisos con la hora ya pasada, que salían al instante.

alter table examen
  add column avisos_dias smallint[],
  add column aviso_hora  time,
  add constraint examen_avisos_dias_validos
    check (avisos_dias is null or (0 <= all (avisos_dias) and 60 >= all (avisos_dias)));

comment on column examen.avisos_dias is
  'Días de antelación de los avisos. NULL = los de Ajustes; {} = sin avisos.';
comment on column examen.aviso_hora is
  'Hora de Madrid a la que avisar. NULL = 09:00.';

-- ---------------------------------------------------------------------------
-- Avisos de un examen. Solo inserta los que aún no han pasado.
-- ---------------------------------------------------------------------------
create or replace function app.generar_avisos_examen(p_examen uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  e record;
  v_dias int[];
  v_cuando timestamptz;
  v_creados integer := 0;
  d int;
begin
  select ex.id, ex.user_id, ex.titulo, ex.fecha, ex.avisos_dias, ex.aviso_hora,
         coalesce(p.preferencias, '{}'::jsonb) as pref
    into e
  from examen ex
  left join perfil p on p.id = ex.user_id
  where ex.id = p_examen;

  if not found then
    return 0;
  end if;

  v_dias := case
    when e.avisos_dias is not null then e.avisos_dias::int[]
    when e.pref ? 'examen_dias' then coalesce(
      (select array_agg(x::int) from jsonb_array_elements_text(e.pref -> 'examen_dias') x),
      '{}'::int[])
    else array[7, 3]
  end;

  foreach d in array v_dias loop
    v_cuando := ((e.fecha - d) + coalesce(e.aviso_hora, time '09:00')) at time zone 'Europe/Madrid';
    continue when v_cuando <= now();

    insert into recordatorio (user_id, tipo, ref_tipo, ref_id, antelacion_min, dispara_en, mensaje)
    values (e.user_id, 'examen', 'examen', e.id, d * 1440, v_cuando,
            e.titulo || case d
              when 0 then ' es hoy'
              when 1 then ' es mañana'
              else ' en ' || d || ' días'
            end)
    on conflict (user_id, tipo, ref_id, antelacion_min) do nothing;

    if found then
      v_creados := v_creados + 1;
    end if;
  end loop;

  return v_creados;
end;
$$;

revoke execute on function app.generar_avisos_examen(uuid) from public;

-- ---------------------------------------------------------------------------
-- Generador general (clases, exámenes y recuperaciones de un usuario).
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
  v_recuperaciones boolean;
  r record;
begin
  select coalesce(preferencias, '{}'::jsonb) into v_pref from perfil where id = p_user;
  v_clase_min := coalesce((v_pref ->> 'clase_antelacion_min')::int, 30);
  v_recuperaciones := coalesce((v_pref ->> 'avisar_recuperaciones')::boolean, true);

  if v_clase_min > 0 then
    for r in
      select c.id,
             ((c.fecha + c.hora_inicio) at time zone 'Europe/Madrid')
               - make_interval(mins => v_clase_min) as cuando
      from clase c
      where c.user_id = p_user and c.estado = 'programada'
        and c.fecha between current_date and current_date + 7
    loop
      continue when r.cuando <= now();

      insert into recordatorio (user_id, tipo, ref_tipo, ref_id, antelacion_min, dispara_en, mensaje)
      values (p_user, 'clase', 'clase', r.id, v_clase_min, r.cuando, 'Clase en ' || v_clase_min || ' min')
      on conflict (user_id, tipo, ref_id, antelacion_min) do nothing;

      if found then
        v_creados := v_creados + 1;
      end if;
    end loop;
  end if;

  for r in
    select e.id from examen e
    where e.user_id = p_user and e.fecha >= current_date
  loop
    v_creados := v_creados + app.generar_avisos_examen(r.id);
  end loop;

  if v_recuperaciones then
    for r in
      select c.id from clase c
      where c.user_id = p_user and c.estado = 'pendiente_recuperar'
    loop
      insert into recordatorio (user_id, tipo, ref_tipo, ref_id, antelacion_min, dispara_en, mensaje)
      values (p_user, 'recuperacion', 'clase', r.id, 0, now(), 'Clase pendiente de recuperar')
      on conflict (user_id, tipo, ref_id, antelacion_min) do nothing;

      if found then
        v_creados := v_creados + 1;
      end if;
    end loop;
  end if;

  return v_creados;
end;
$$;

-- ---------------------------------------------------------------------------
-- Rehace los avisos futuros de un usuario (al cambiar Ajustes o importar).
-- Los ya enviados o vistos se conservan.
-- ---------------------------------------------------------------------------
create or replace function app.resincronizar_recordatorios(p_user uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from recordatorio
  where user_id = p_user
    and estado = 'pendiente'
    and dispara_en > now()
    and tipo in ('clase', 'examen');

  return app.generar_recordatorios(p_user);
end;
$$;

revoke execute on function app.resincronizar_recordatorios(uuid) from public;

-- ---------------------------------------------------------------------------
-- Al crear, cambiar o borrar un examen, sus avisos se rehacen al momento.
-- ---------------------------------------------------------------------------
create or replace function app.resembrar_avisos_examen()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    delete from recordatorio where ref_tipo = 'examen' and ref_id = old.id;
    return old;
  end if;

  if tg_op = 'UPDATE' then
    delete from recordatorio
    where ref_tipo = 'examen' and ref_id = old.id
      and estado = 'pendiente' and dispara_en > now();
  end if;

  perform app.generar_avisos_examen(new.id);
  return new;
end;
$$;

create trigger examen_resembrar_avisos
  after insert or update of fecha, titulo, avisos_dias, aviso_hora or delete on examen
  for each row execute function app.resembrar_avisos_examen();

-- ---------------------------------------------------------------------------
-- Al cambiar los ajustes de avisos, se aplican ya y no solo a partir de mañana.
-- ---------------------------------------------------------------------------
create or replace function app.resembrar_avisos_preferencias()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform app.resincronizar_recordatorios(new.id);
  return new;
end;
$$;

create trigger perfil_resembrar_avisos
  after update of preferencias on perfil
  for each row
  when (old.preferencias is distinct from new.preferencias)
  execute function app.resembrar_avisos_preferencias();
