-- AulaMia · permite dar clase a varios alumnos a la misma hora
-- (el profesor puede compaginar varias clases en paralelo).

alter table clase drop constraint if exists clase_sin_solape;

-- El motor de clases deja de saltarse una clase recurrente por solapar con
-- otra ya existente del mismo profesor: ahora el solape está permitido.
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
  v_limite date := current_date + p_horizonte_dias;
begin
  for h in
    select hr.*
    from horario_recurrente hr
    join alumno a on a.id = hr.alumno_id
    where hr.user_id = p_user and hr.activo and a.activo
  loop
    v_hora_fin := h.hora_inicio + make_interval(mins => h.duracion_min);

    d := greatest(h.vigente_desde, current_date);
    while d <= least(coalesce(h.vigente_hasta, v_limite), v_limite) loop
      if extract(isodow from d)::int = h.dia_semana
        and not exists (
          select 1 from clase c
          where c.horario_recurrente_id = h.id and c.fecha = d
        )
        and not exists (
          select 1 from disponibilidad_excepcion e
          where e.user_id = p_user and e.fecha = d
            and e.tipo = 'bloqueo' and e.hora_inicio is null
        )
      then
        insert into clase (
          user_id, alumno_id, materia_id, horario_recurrente_id,
          fecha, hora_inicio, hora_fin, estado, origen, precio
        ) values (
          p_user, h.alumno_id, h.materia_id, h.id,
          d, h.hora_inicio, v_hora_fin, 'programada', 'recurrente', h.precio
        );
        v_creadas := v_creadas + 1;
      end if;
      d := d + 1;
    end loop;
  end loop;

  return v_creadas;
end;
$$;
