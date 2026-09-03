-- AulaMia · Fase 01 · Núcleo: alumnos y materias

create table materia (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre    text not null,
  color     text,
  creado_en timestamptz not null default now(),
  unique (user_id, nombre)
);

create table alumno (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre            text not null,
  apellidos         text,
  fecha_nacimiento  date,
  curso             text,
  nivel             text,
  observaciones     text,
  color             text not null default '#4353c4',
  precio_hora       numeric(8, 2),
  prioridad         smallint not null default 2 check (prioridad between 1 and 3),
  activo            boolean not null default true,
  creado_en         timestamptz not null default now(),
  actualizado_en    timestamptz not null default now()
);

create trigger alumno_updated_at
  before update on alumno
  for each row execute function set_updated_at();

create table alumno_materia (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  alumno_id         uuid not null references alumno (id) on delete cascade,
  materia_id        uuid not null references materia (id) on delete cascade,
  nivel             text,
  dificultades      text,
  prioridad         smallint not null default 2 check (prioridad between 1 and 3),
  horas_recomendadas numeric(4, 1),
  creado_en         timestamptz not null default now(),
  unique (alumno_id, materia_id)
);
