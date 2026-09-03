-- AulaMia · Fase 01 · Agenda: horarios recurrentes, clases, plan de sesión, tareas, auditoría

create table horario_recurrente (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  alumno_id      uuid not null references alumno (id) on delete cascade,
  materia_id     uuid references materia (id) on delete set null,
  dia_semana     smallint not null check (dia_semana between 1 and 7), -- 1 = lunes
  hora_inicio    time not null,
  duracion_min   integer not null default 60 check (duracion_min between 15 and 480),
  vigente_desde  date not null default current_date,
  vigente_hasta  date,
  precio         numeric(8, 2),
  activo         boolean not null default true,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  check (vigente_hasta is null or vigente_hasta >= vigente_desde)
);

create trigger horario_recurrente_updated_at
  before update on horario_recurrente
  for each row execute function set_updated_at();

create table clase (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null default auth.uid() references auth.users (id) on delete cascade,
  alumno_id             uuid not null references alumno (id) on delete cascade,
  materia_id            uuid references materia (id) on delete set null,
  horario_recurrente_id uuid references horario_recurrente (id) on delete set null,
  fecha                 date not null,
  hora_inicio           time not null,
  hora_fin              time not null,
  estado                estado_clase not null default 'programada',
  origen                origen_clase not null default 'manual',
  modificada            boolean not null default false,
  recupera_a_clase_id   uuid references clase (id) on delete set null,
  precio                numeric(8, 2),
  cobrada               boolean not null default false,
  notas_profesor        text,
  creado_en             timestamptz not null default now(),
  actualizado_en        timestamptz not null default now(),
  check (hora_fin > hora_inicio),

  -- Franjas de inicio/fin como timestamp local, para la exclusión horaria
  inicio_ts timestamp generated always as (fecha + hora_inicio) stored,
  fin_ts    timestamp generated always as (fecha + hora_fin) stored,

  -- Ninguna clase no cancelada del mismo profesor puede solaparse en el tiempo
  constraint clase_sin_solape exclude using gist (
    user_id with =,
    tsrange(inicio_ts, fin_ts) with &&
  ) where (estado <> 'cancelada'),

  -- Una sesión materializada por combinación de horario + fecha
  unique (horario_recurrente_id, fecha)
);

create trigger clase_updated_at
  before update on clase
  for each row execute function set_updated_at();

create table plan_sesion (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  clase_id       uuid not null unique references clase (id) on delete cascade,
  tema           text,
  contenido      text,
  objetivo       text,
  deberes_casa   text,
  examen_id      uuid,  -- FK añadida en la migración de exámenes
  nivel_progreso smallint check (nivel_progreso between 1 and 5),
  notas          text,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create trigger plan_sesion_updated_at
  before update on plan_sesion
  for each row execute function set_updated_at();

create table tarea (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  alumno_id     uuid not null references alumno (id) on delete cascade,
  clase_id      uuid references clase (id) on delete set null,
  materia_id    uuid references materia (id) on delete set null,
  descripcion   text not null,
  tipo          tipo_tarea not null default 'deberes',
  completada    boolean not null default false,
  fecha_limite  date,
  creado_en     timestamptz not null default now()
);

create table cambio_clase (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  clase_id        uuid not null references clase (id) on delete cascade,
  tipo            tipo_cambio_clase not null,
  valor_anterior  jsonb,
  valor_nuevo     jsonb,
  motivo          text,
  creado_en       timestamptz not null default now()
);
