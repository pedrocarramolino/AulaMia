-- AulaMia · Fase 04 · Acciones sobre clases (cancelar, mover, recuperar, reactivar)
-- Cada acción actualiza la clase y registra la auditoría en `cambio_clase`,
-- todo en una transacción. SECURITY INVOKER: la RLS limita a las clases propias.

-- Una clase pendiente de recuperar tampoco ocupa su hueco original.
alter table clase drop constraint clase_sin_solape;
alter table clase add constraint clase_sin_solape exclude using gist (
  user_id with =,
  tsrange(inicio_ts, fin_ts) with &&
) where (estado not in ('cancelada', 'pendiente_recuperar'));

-- ---------------------------------------------------------------------------
create or replace function public.cancelar_clase(
  p_clase uuid,
  p_motivo text default null,
  p_pendiente_recuperar boolean default false
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  c clase;
  v_estado estado_clase;
begin
  select * into c from clase where id = p_clase;
  if not found then raise exception 'Clase no encontrada'; end if;

  v_estado := case when p_pendiente_recuperar then 'pendiente_recuperar' else 'cancelada' end;

  update clase set estado = v_estado, modificada = true where id = p_clase;

  insert into cambio_clase (clase_id, tipo, valor_anterior, valor_nuevo, motivo)
  values (
    p_clase, 'cancelada',
    jsonb_build_object('estado', c.estado),
    jsonb_build_object('estado', v_estado),
    p_motivo
  );
end;
$$;

-- ---------------------------------------------------------------------------
create or replace function public.mover_clase(
  p_clase uuid,
  p_fecha date,
  p_hora_inicio time,
  p_hora_fin time,
  p_motivo text default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  c clase;
  v_tipo tipo_cambio_clase;
begin
  select * into c from clase where id = p_clase;
  if not found then raise exception 'Clase no encontrada'; end if;

  v_tipo := case
    when p_fecha is distinct from c.fecha then 'cambio_fecha'
    when p_hora_inicio is distinct from c.hora_inicio then 'cambio_hora'
    else 'cambio_duracion'
  end;

  update clase
     set fecha = p_fecha, hora_inicio = p_hora_inicio, hora_fin = p_hora_fin,
         modificada = true
   where id = p_clase;

  insert into cambio_clase (clase_id, tipo, valor_anterior, valor_nuevo, motivo)
  values (
    p_clase, v_tipo,
    jsonb_build_object('fecha', c.fecha, 'hora_inicio', c.hora_inicio, 'hora_fin', c.hora_fin),
    jsonb_build_object('fecha', p_fecha, 'hora_inicio', p_hora_inicio, 'hora_fin', p_hora_fin),
    p_motivo
  );
end;
$$;

-- ---------------------------------------------------------------------------
create or replace function public.recuperar_clase(
  p_clase uuid,
  p_fecha date,
  p_hora_inicio time,
  p_hora_fin time
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  c clase;
  v_nueva uuid;
begin
  select * into c from clase where id = p_clase;
  if not found then raise exception 'Clase no encontrada'; end if;

  insert into clase (
    alumno_id, materia_id, fecha, hora_inicio, hora_fin,
    estado, origen, precio, recupera_a_clase_id
  ) values (
    c.alumno_id, c.materia_id, p_fecha, p_hora_inicio, p_hora_fin,
    'programada', 'recuperacion', c.precio, c.id
  ) returning id into v_nueva;

  update clase set estado = 'cancelada'
   where id = p_clase and estado = 'pendiente_recuperar';

  insert into cambio_clase (clase_id, tipo, valor_nuevo)
  values (c.id, 'recuperada',
          jsonb_build_object('recuperacion_id', v_nueva, 'fecha', p_fecha));

  return v_nueva;
end;
$$;

-- ---------------------------------------------------------------------------
create or replace function public.reactivar_clase(p_clase uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  c clase;
begin
  select * into c from clase where id = p_clase;
  if not found then raise exception 'Clase no encontrada'; end if;

  update clase set estado = 'programada', modificada = true where id = p_clase;

  insert into cambio_clase (clase_id, tipo, valor_anterior, valor_nuevo)
  values (p_clase, 'reactivada',
          jsonb_build_object('estado', c.estado),
          jsonb_build_object('estado', 'programada'));
end;
$$;

grant execute on function public.cancelar_clase(uuid, text, boolean) to authenticated;
grant execute on function public.mover_clase(uuid, date, time, time, text) to authenticated;
grant execute on function public.recuperar_clase(uuid, date, time, time) to authenticated;
grant execute on function public.reactivar_clase(uuid) to authenticated;
