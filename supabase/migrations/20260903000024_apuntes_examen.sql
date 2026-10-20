-- AulaMia · Apuntes de estudio generados para un examen
--
-- Los genera la Edge Function `generar-apuntes` con Claude a partir de lo que
-- el profesor cuenta del examen. Uno por examen: regenerarlos los sustituye.
-- `contenido` sigue el esquema de la función (temas con explicación, puntos
-- clave, conceptos y preguntas de repaso).

create table apuntes_examen (
  examen_id     uuid primary key references examen (id) on delete cascade,
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  descripcion   text not null,
  enfoque       text,
  contenido     jsonb not null,
  modelo        text not null,
  creado_en     timestamptz not null default now()
);

alter table apuntes_examen enable row level security;

create policy apuntes_examen_propietario on apuntes_examen
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
