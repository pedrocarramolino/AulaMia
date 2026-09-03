-- AulaMia · Fase 08 · Endurecer (avisos del linter)

-- 1. app_config: sin acceso para roles de la API
revoke all on app_config from anon, authenticated;

-- 2. pg_net fuera de public
drop extension if exists pg_net;
create extension pg_net with schema extensions;

-- rehacer el cron con la ruta correcta del http_post
select cron.unschedule('enviar-recordatorios');
select cron.schedule(
  'enviar-recordatorios',
  '*/5 * * * *',
  $$
  select extensions.http_post(
    url := 'https://gudvgxzraisolcpwprlz.supabase.co/functions/v1/enviar-recordatorios',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select cron_secret from app_config where id = 'global')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- 3. importar_datos: mover la lógica a app.* (no expuesto) y dejar un wrapper INVOKER
create or replace function app.importar_datos(p jsonb, p_user uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  u uuid := p_user;
  d jsonb := coalesce(p -> 'datos', '{}'::jsonb);
begin
  if u is null then raise exception 'No autenticado'; end if;

  delete from recordatorio where user_id = u;
  delete from nota where user_id = u;
  delete from cambio_clase where user_id = u;
  delete from tarea where user_id = u;
  delete from plan_sesion where user_id = u;
  delete from plan_examen where user_id = u;
  delete from clase where user_id = u;
  delete from examen where user_id = u;
  delete from horario_recurrente where user_id = u;
  delete from alumno_materia where user_id = u;
  delete from disponibilidad_excepcion where user_id = u;
  delete from disponibilidad where user_id = u;
  delete from alumno where user_id = u;
  delete from materia where user_id = u;

  alter table horario_recurrente disable trigger horario_resembrar_ins_upd;

  insert into materia (id, user_id, nombre, color, creado_en)
  select r.id, u, r.nombre, r.color, r.creado_en
  from jsonb_populate_recordset(null::materia, coalesce(d -> 'materia', '[]'::jsonb)) r;

  insert into alumno (id, user_id, nombre, apellidos, fecha_nacimiento, curso, nivel,
    observaciones, color, precio_hora, prioridad, activo, creado_en, actualizado_en)
  select r.id, u, r.nombre, r.apellidos, r.fecha_nacimiento, r.curso, r.nivel,
    r.observaciones, r.color, r.precio_hora, r.prioridad, r.activo, r.creado_en, r.actualizado_en
  from jsonb_populate_recordset(null::alumno, coalesce(d -> 'alumno', '[]'::jsonb)) r;

  insert into alumno_materia (id, user_id, alumno_id, materia_id, nivel, dificultades,
    prioridad, horas_recomendadas, creado_en)
  select r.id, u, r.alumno_id, r.materia_id, r.nivel, r.dificultades, r.prioridad,
    r.horas_recomendadas, r.creado_en
  from jsonb_populate_recordset(null::alumno_materia, coalesce(d -> 'alumno_materia', '[]'::jsonb)) r;

  insert into disponibilidad (id, user_id, dia_semana, hora_inicio, hora_fin, creado_en)
  select r.id, u, r.dia_semana, r.hora_inicio, r.hora_fin, r.creado_en
  from jsonb_populate_recordset(null::disponibilidad, coalesce(d -> 'disponibilidad', '[]'::jsonb)) r;

  insert into disponibilidad_excepcion (id, user_id, fecha, tipo, hora_inicio, hora_fin, motivo, creado_en)
  select r.id, u, r.fecha, r.tipo, r.hora_inicio, r.hora_fin, r.motivo, r.creado_en
  from jsonb_populate_recordset(null::disponibilidad_excepcion,
    coalesce(d -> 'disponibilidad_excepcion', '[]'::jsonb)) r;

  insert into horario_recurrente (id, user_id, alumno_id, materia_id, dia_semana, hora_inicio,
    duracion_min, vigente_desde, vigente_hasta, precio, activo, creado_en, actualizado_en)
  select r.id, u, r.alumno_id, r.materia_id, r.dia_semana, r.hora_inicio, r.duracion_min,
    r.vigente_desde, r.vigente_hasta, r.precio, r.activo, r.creado_en, r.actualizado_en
  from jsonb_populate_recordset(null::horario_recurrente, coalesce(d -> 'horario_recurrente', '[]'::jsonb)) r;

  insert into examen (id, user_id, alumno_id, materia_id, titulo, fecha, temario,
    nivel_preparacion, notas, creado_en, actualizado_en)
  select r.id, u, r.alumno_id, r.materia_id, r.titulo, r.fecha, r.temario,
    r.nivel_preparacion, r.notas, r.creado_en, r.actualizado_en
  from jsonb_populate_recordset(null::examen, coalesce(d -> 'examen', '[]'::jsonb)) r;

  insert into clase (id, user_id, alumno_id, materia_id, horario_recurrente_id, fecha,
    hora_inicio, hora_fin, estado, origen, modificada, precio, cobrada, notas_profesor,
    creado_en, actualizado_en)
  select r.id, u, r.alumno_id, r.materia_id, r.horario_recurrente_id, r.fecha,
    r.hora_inicio, r.hora_fin, r.estado, r.origen, r.modificada, r.precio, r.cobrada,
    r.notas_profesor, r.creado_en, r.actualizado_en
  from jsonb_populate_recordset(null::clase, coalesce(d -> 'clase', '[]'::jsonb)) r;

  update clase c set recupera_a_clase_id = r.recupera_a_clase_id
  from jsonb_populate_recordset(null::clase, coalesce(d -> 'clase', '[]'::jsonb)) r
  where c.id = r.id and r.recupera_a_clase_id is not null
    and exists (select 1 from clase x where x.id = r.recupera_a_clase_id);

  insert into plan_examen (id, user_id, examen_id, fecha, descripcion, clase_id, completado, orden, creado_en)
  select r.id, u, r.examen_id, r.fecha, r.descripcion, r.clase_id, r.completado, r.orden, r.creado_en
  from jsonb_populate_recordset(null::plan_examen, coalesce(d -> 'plan_examen', '[]'::jsonb)) r;

  insert into plan_sesion (id, user_id, clase_id, tema, contenido, objetivo, deberes_casa,
    examen_id, nivel_progreso, notas, creado_en, actualizado_en)
  select r.id, u, r.clase_id, r.tema, r.contenido, r.objetivo, r.deberes_casa,
    r.examen_id, r.nivel_progreso, r.notas, r.creado_en, r.actualizado_en
  from jsonb_populate_recordset(null::plan_sesion, coalesce(d -> 'plan_sesion', '[]'::jsonb)) r;

  insert into tarea (id, user_id, alumno_id, clase_id, materia_id, descripcion, tipo,
    completada, fecha_limite, creado_en)
  select r.id, u, r.alumno_id, r.clase_id, r.materia_id, r.descripcion, r.tipo,
    r.completada, r.fecha_limite, r.creado_en
  from jsonb_populate_recordset(null::tarea, coalesce(d -> 'tarea', '[]'::jsonb)) r;

  insert into cambio_clase (id, user_id, clase_id, tipo, valor_anterior, valor_nuevo, motivo, creado_en)
  select r.id, u, r.clase_id, r.tipo, r.valor_anterior, r.valor_nuevo, r.motivo, r.creado_en
  from jsonb_populate_recordset(null::cambio_clase, coalesce(d -> 'cambio_clase', '[]'::jsonb)) r;

  insert into nota (id, user_id, alumno_id, clase_id, texto, creado_en)
  select r.id, u, r.alumno_id, r.clase_id, r.texto, r.creado_en
  from jsonb_populate_recordset(null::nota, coalesce(d -> 'nota', '[]'::jsonb)) r;

  insert into recordatorio (id, user_id, tipo, ref_tipo, ref_id, antelacion_min, dispara_en, estado, mensaje, creado_en)
  select r.id, u, r.tipo, r.ref_tipo, r.ref_id, r.antelacion_min, r.dispara_en, r.estado, r.mensaje, r.creado_en
  from jsonb_populate_recordset(null::recordatorio, coalesce(d -> 'recordatorio', '[]'::jsonb)) r;

  alter table horario_recurrente enable trigger horario_resembrar_ins_upd;

  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function app.importar_datos(jsonb, uuid) from public;
grant execute on function app.importar_datos(jsonb, uuid) to authenticated;

create or replace function public.importar_datos(p jsonb)
returns jsonb
language sql
security invoker
set search_path = public
as $$
  select app.importar_datos(p, auth.uid());
$$;

grant execute on function public.importar_datos(jsonb) to authenticated;
