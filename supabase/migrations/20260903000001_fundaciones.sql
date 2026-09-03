-- AulaMia · Fase 01 · Fundaciones
-- Extensiones, enums, función de updated_at y tabla de perfil.

create extension if not exists "pgcrypto";
create extension if not exists btree_gist;

-- ---------------------------------------------------------------------------
-- Enumeraciones
-- ---------------------------------------------------------------------------
create type estado_clase as enum (
  'programada', 'realizada', 'cancelada', 'aplazada', 'pendiente_recuperar'
);

create type origen_clase as enum (
  'recurrente', 'manual', 'recuperacion', 'extraordinaria'
);

create type tipo_cambio_clase as enum (
  'cancelada', 'cambio_fecha', 'cambio_hora', 'cambio_duracion', 'recuperada', 'reactivada'
);

create type tipo_tarea as enum ('en_clase', 'deberes');

create type tipo_excepcion as enum ('bloqueo', 'extra');

create type tipo_recordatorio as enum ('clase', 'examen', 'inactividad', 'recuperacion');

create type estado_recordatorio as enum ('pendiente', 'enviado', 'visto');

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Perfil del profesor (1 fila por usuario de auth)
-- ---------------------------------------------------------------------------
create table perfil (
  id            uuid primary key references auth.users (id) on delete cascade,
  nombre        text,
  email         text,
  preferencias  jsonb not null default '{}'::jsonb,
  creado_en     timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create trigger perfil_updated_at
  before update on perfil
  for each row execute function set_updated_at();

-- Crea el perfil al registrarse un usuario
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfil (id, email, nombre)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

alter table perfil enable row level security;

create policy "perfil: ver el propio"
  on perfil for select using (id = auth.uid());

create policy "perfil: editar el propio"
  on perfil for update using (id = auth.uid()) with check (id = auth.uid());
