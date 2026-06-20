-- migrate: up
-- Cita Perfecta - limpieza de estabilizacion
-- Timestamp ajustado para evitar orden ambiguo con stabilization_complete.
-- No elimina datos automaticamente. Esta migracion documenta la consolidacion
-- de codigo duplicado en Angular; no hay tablas seguras para borrar sin auditar datos.

-- migrate: down
-- Sin cambios reversibles.
