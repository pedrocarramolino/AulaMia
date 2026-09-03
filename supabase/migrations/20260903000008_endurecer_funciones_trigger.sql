-- AulaMia · Fase 01 · Quitar las funciones de trigger de la API REST
-- El grant por defecto de EXECUTE es a PUBLIC; hay que revocarlo ahí.
-- Los triggers siguen ejecutándose (corren como propietario de la tabla).

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.set_updated_at() from public;
