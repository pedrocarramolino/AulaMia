-- AulaMia · Fase 01 · Exámenes, plan de examen, disponibilidad, recordatorios y notas

create table examen (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  alumno_id         uuid not null references alumno (id) on delete cascade,
  materia_id        uuid references materia (id) on delete set null,
  titulo            text not null,
  fecha             date not null,
  temario           text,
  nivel_preparacion smallint not null default 1 check (nivel_preparacion between 1 and 5),
  notas             text,
  creado_en         timestamptz not null default now(),
  actualizado_en    timestamptz not null default now()
);

create trigger examen_updated_at
  before update on examen
  for each row execute function set_updated_at();

-- FK diferida de plan_sesion.examen_id
alter table plan_sesion
  add constraint plan_sesion_examen_fk
  foreign key (examen_id) references examen (id) on delete set null;

create table plan_examen (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  examen_id   uuid not null references examen (id) on delete cascade,
  fecha       date not null,
  descripcion text not null,
  clase_id    uuid references clase (id) on delete set null,
  completado  boolean not null default false,
  orden       integer not null default 0,
  creado_en   timestamptz not null default now()
);

create table disponibilidad (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dia_semana  smallint not null check (dia_semana between 1 and 7),
  hora_inicio time not null,
  hora_fin    time not null,
  creado_en   timestamptz not null default now(),
  check (hora_fin > hora_inicio)
);

create table disponibilidad_excepcion (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha       date not null,
  tipo        tipo_excepcion not null,
  hora_inicio time,
  hora_fin    time,
  motivo      text,
  creado_en   timestamptz not null default now(),
  check (
    (hora_inicio is null and hora_fin is null)
    or (hora_inicio is not null and hora_fin is not null and hora_fin > hora_inicio)
  )
);

create table recordatorio (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tipo           tipo_recordatorio not null,
  ref_tipo       text not null,
  ref_id         uuid not null,
  antelacion_min integer not null default 30,
  dispara_en     timestamptz not null,
  estado         estado_recordatorio not null default 'pendiente',
  mensaje        text,
  creado_en      timestamptz not null default now()
);

create table nota (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  alumno_id  uuid references alumno (id) on delete cascade,
  clase_id   uuid references clase (id) on delete cascade,
  texto      text not null,
  creado_en  timestamptz not null default now()
);
