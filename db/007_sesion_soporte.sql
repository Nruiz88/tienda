-- ================================================================
-- 007 — Columnas de soporte en la tabla de sesiones
-- ------------------------------------------------------------
-- HUECO QUE APARECIÓ AL CONECTAR LA BASE DE VERDAD
-- ------------------------------------------------
-- `sesion.ts` (crearSesion) escribe TRES columnas de soporte:
--
--     soporte_de          cliente que atiende una sesión de staff
--     soporte_motivo      por qué entra (obligatorio si hay soporte_de)
--     soporte_abierto_en  cuándo se abrió
--
-- pero el `001_sesiones.sql` de la plantilla NO las creaba: solo las
-- menciona en un comentario ("ver migración de soporte si lo necesitas").
-- Con la tabla creada tal cual, el primer canje real falla con
-- "Could not find the 'soporte_abierto_en' column".
--
-- Es el tipo de cosa que no la ve el compilador ni los tests: se ve la
-- primera vez que se guarda una sesión.
-- ================================================================

alter table shop_sesiones add column if not exists soporte_de          uuid references clients on delete set null;
alter table shop_sesiones add column if not exists soporte_motivo      text;
alter table shop_sesiones add column if not exists soporte_abierto_en  timestamptz;

comment on column shop_sesiones.soporte_de is
  'Cliente que atiende esta sesión cuando es de staff (soporte). NULL en sesiones de cliente.';
comment on column shop_sesiones.soporte_motivo is
  'Por qué entra el staff. Nunca vacío si hay soporte_de.';
