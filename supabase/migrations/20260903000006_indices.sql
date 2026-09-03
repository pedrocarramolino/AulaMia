-- AulaMia · Fase 01 · Índices para las consultas habituales

create index idx_alumno_user            on alumno (user_id) where activo;
create index idx_materia_user            on materia (user_id);
create index idx_alumno_materia_alumno   on alumno_materia (alumno_id);
create index idx_alumno_materia_materia  on alumno_materia (materia_id);

create index idx_horario_alumno          on horario_recurrente (alumno_id) where activo;
create index idx_horario_user_activo     on horario_recurrente (user_id, dia_semana) where activo;

create index idx_clase_user_fecha        on clase (user_id, fecha);
create index idx_clase_alumno_fecha      on clase (alumno_id, fecha desc);
create index idx_clase_horario           on clase (horario_recurrente_id);
create index idx_clase_estado            on clase (user_id, estado) where estado in ('pendiente_recuperar', 'programada');

create index idx_plan_sesion_clase       on plan_sesion (clase_id);
create index idx_tarea_alumno            on tarea (alumno_id) where not completada;
create index idx_tarea_clase             on tarea (clase_id);
create index idx_cambio_clase_clase      on cambio_clase (clase_id, creado_en desc);

create index idx_examen_user_fecha       on examen (user_id, fecha);
create index idx_examen_alumno           on examen (alumno_id, fecha);
create index idx_plan_examen_examen      on plan_examen (examen_id, fecha);

create index idx_disponibilidad_user     on disponibilidad (user_id, dia_semana);
create index idx_excepcion_user_fecha    on disponibilidad_excepcion (user_id, fecha);
create index idx_recordatorio_pendiente  on recordatorio (dispara_en) where estado = 'pendiente';
create index idx_nota_alumno             on nota (alumno_id, creado_en desc);
create index idx_nota_clase              on nota (clase_id);
