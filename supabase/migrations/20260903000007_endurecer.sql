-- AulaMia · Fase 01 · Endurecer (avisos del linter de seguridad)

-- 1. search_path fijo en la función de updated_at
alter function set_updated_at() set search_path = public;

-- 2. Las funciones de trigger no deben ser invocables por la API REST
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.set_updated_at() from anon, authenticated;

-- 3. btree_gist fuera del esquema public
alter extension btree_gist set schema extensions;
