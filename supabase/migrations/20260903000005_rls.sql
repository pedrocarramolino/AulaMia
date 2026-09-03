-- AulaMia · Fase 01 · Row Level Security
-- Regla única: cada usuario solo ve y escribe sus propias filas (user_id = auth.uid()).
-- Deja la puerta abierta al multiusuario sin cambiar el modelo.

do $$
declare
  t text;
  tablas text[] := array[
    'materia', 'alumno', 'alumno_materia',
    'horario_recurrente', 'clase', 'plan_sesion', 'tarea', 'cambio_clase',
    'examen', 'plan_examen',
    'disponibilidad', 'disponibilidad_excepcion', 'recordatorio', 'nota'
  ];
begin
  foreach t in array tablas loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t || '_propietario', t);
    execute format(
      'create policy %I on %I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t || '_propietario', t
    );
  end loop;
end;
$$;
