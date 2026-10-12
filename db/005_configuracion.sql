-- ================================================================
-- 005 — Configuración de la tienda
-- ------------------------------------------------------------
-- Una fila por cliente: contacto, redes, datos de transferencia y las
-- claves de MercadoPago.

--   ⚠️  `mercadopago_access_token` ES UN SECRETO
--   ------------------------------------------
--   Con ese token se cobra Y SE DEVUELVE dinero. Por eso:
--     · sólo la alcanza el servidor con la secret key, y
--     · la tabla NO tiene política para `anon` (el storefront público no
--       la lee nunca).
--   Aun así, para producción conviene cifrarla en reposo (pgcrypto) o
--   guardarla en un gestor de secretos. RLS la protege de otros clientes,
--   no de un backup.
-- ================================================================


create table if not exists shop_configuracion (
  id          uuid primary key default gen_random_uuid(),

  client_id   uuid not null references clients on delete cascade,

  /* ── Contacto y redes ── */
  whatsapp    text,
  email       text,
  instagram   text,
  facebook    text,

  /* ── Transferencia ── */
  transf_titular text,
  transf_banco   text,
  transf_cbu     text,
  transf_alias   text,

  /* ── MercadoPago ── */
  mercadopago_public_key     text,
  /* SECRETO. Ver el aviso de arriba. */
  mercadopago_access_token   text,

  actualizado_en timestamptz not null default now(),

  /* Un cliente, una configuración. */
  unique (client_id)
);

comment on table shop_configuracion is
  'Configuración por cliente: contacto, redes, transferencia y claves de MercadoPago. El access token es un secreto y no se expone a anon.';
comment on column shop_configuracion.mercadopago_access_token is
  'SECRETO de MercadoPago. Con él se cobra y se devuelve dinero. Nunca baja al navegador.';

alter table shop_configuracion enable row level security;

/* Solo el dueño (o el staff de soporte) lee y escribe la suya. */
create policy shop_configuracion_admin on shop_configuracion
  for all
  using (client_id = public.shop_cliente_actual())
  with check (client_id = public.shop_cliente_actual());

/* Sin política para `anon`: el storefront público no toca esto. El
   contacto público (redes, WhatsApp) lo sirve el servidor si hace falta,
   no la base directamente. */


-- ---------------------------------------------------------------------
-- `actualizado_en` se mueve solo
-- ---------------------------------------------------------------------
create or replace function public.shop_tocar_actualizado()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

drop trigger if exists tr_shop_configuracion_actualizado on shop_configuracion;
create trigger tr_shop_configuracion_actualizado
  before update on shop_configuracion
  for each row
  execute function public.shop_tocar_actualizado();
