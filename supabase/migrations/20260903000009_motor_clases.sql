-- AulaMia · Fase 03 · Motor de generación de clases recurrentes
--
-- Los `horario_recurrente` son el patrón; las `clase` son las sesiones reales,
-- materializadas para un horizonte móvil (por defecto 8 semanas).

create schema if not exists app;
grant usage on schema app to authenticated;

-- ---------------------------------------------------------------------------
-- Genera las clases que falten para un usuario, dentro del horizonte.
-- SECURITY DEFINER: opera solo sobre las filas de p_user (filtrado explícito).
-- ---------------------------------------------------------------------------
create or replace function app.generar_clases_para(
  p_user uuid,
  p_horizonte_dias int default 56
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_creadas integer := 0;
  h record;
  d date;
  v_hora_fin time;
  v_precio numeric(8, 2);
  v_limite date := current_date + p_horizonte_dias;
begin
  for h in
    select hr.*, a.precio_hora
    from horario_recurrente hr
    join alumno a on a.id = hr.alumno_id
    where hr.user_id = p_user and hr.activo and a.activo
  loop
    v_hora_fin := h.hora_inicio + make_interval(mins => h.duracion_min);
    v_precio := coalesce(h.precio, round(h.precio_hora * h.duracion_min / 60.0, 2));

    d := greatest(h.vigente_desde, current_date);
    while d <= least(coalesce(h.vigente_hasta, v_limite), v_limite) loop
      if extract(isodow from d)::int = h.dia_semana
        -- la sesión de esta serie en esta fecha aún no existe
        and not exists (
          select 1 from clase c
          where c.horario_recurrente_id = h.id and c.fecha = d
        )
        -- el día no está bloqueado por completo
        and not exists (
          select 1 from disponibilidad_excepcion e
          where e.user_id = p_user and e.fecha = d
            and e.tipo = 'bloqueo' and e.hora_inicio is null
        )
        -- no se solapa con otra clase no cancelada
        and not exists (
          select 1 from clase c
          where c.user_id = p_user and c.estado <> 'cancelada'
            and tsrange(c.inicio_ts, c.fin_ts)
                && tsrange(d + h.hora_inicio, d + v_hora_fin)
        )
      then
        insert into clase (
          user_id, alumno_id, materia_id, horario_recurrente_id,
          fecha, hora_inicio, hora_fin, estado, origen, precio
        ) values (
          p_user, h.alumno_id, h.materia_id, h.id,
          d, h.hora_inicio, v_hora_fin, 'programada', 'recurrente', v_precio
        );
        v_creadas := v_creadas + 1;
      end if;
      d := d + 1;
    end loop;
  end loop;

  return v_creadas;
end;
$$;

revoke execute on function app.generar_clases_para(uuid, int) from public;
grant execute on function app.generar_clases_para(uuid, int) to authenticated;

-- ---------------------------------------------------------------------------
-- Punto de entrada para el cliente: genera las clases del usuario actual.
-- ---------------------------------------------------------------------------
create or replace function public.generar_mis_clases(p_horizonte_dias int default 56)
returns integer
language sql
security invoker
set search_path = public
as $$
  select app.generar_clases_para(auth.uid(), p_horizonte_dias);
$$;

grant execute on function public.generar_mis_clases(int) to authenticated;

-- ---------------------------------------------------------------------------
-- Al crear / cambiar / borrar un horario: quita las clases futuras aún sin
-- tocar de esa serie y, si sigue activa, vuelve a generar.
-- ---------------------------------------------------------------------------
create or replace function app.resembrar_horario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    delete from clase
     where horario_recurrente_id = old.id
       and fecha > current_date
       and estado = 'programada'
       and not modificada;
    return old;
  end if;

  if tg_op = 'UPDATE'
     and new.dia_semana is not distinct from old.dia_semana
     and new.hora_inicio is not distinct from old.hora_inicio
     and new.duracion_min is not distinct from old.duracion_min
     and new.materia_id is not distinct from old.materia_id
     and new.vigente_desde is not distinct from old.vigente_desde
     and new.vigente_hasta is not distinct from old.vigente_hasta
     and new.activo is not distinct from old.activo
     and new.precio is not distinct from old.precio
  then
    return new; -- nada relevante cambió
  end if;

  delete from clase
   where horario_recurrente_id = new.id
     and fecha > current_date
     and estado = 'programada'
     and not modificada;

  if new.activo then
    perform app.generar_clases_para(new.user_id);
  end if;

  return new;
end;
$$;

create trigger horario_resembrar_del
  before delete on horario_recurrente
  for each row execute function app.resembrar_horario();

create trigger horario_resembrar_ins_upd
  after insert or update on horario_recurrente
  for each row execute function app.resembrar_horario();
