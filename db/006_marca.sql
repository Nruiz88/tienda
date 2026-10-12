-- ================================================================
-- 006 — Marca (logo y banner) y almacenamiento de imágenes
-- ------------------------------------------------------------
-- · Logo y banner de la tienda, en `shop_tiendas`.
-- · Segunda imagen por producto, en `shop_productos`.
-- · Un bucket de Storage para los archivos subidos.

--   ⚠️  EL BUCKET ES PÚBLICO A PROPÓSITO
--   -----------------------------------
--   Son imágenes de una tienda: logo, banner y fotos de producto. Tienen
--   que verse en el storefront sin sesión. Se guardan bajo la carpeta del
--   cliente (`clientes/<client_id>/…`), que da orden, pero el bucket es de
--   lectura pública. No subir ahí nada privado.
-- ================================================================


-- ---------------------------------------------------------------------
-- 1. Marca de la tienda
-- ---------------------------------------------------------------------
alter table shop_tiendas add column if not exists logo_url   text;
alter table shop_tiendas add column if not exists banner_url text;

comment on column shop_tiendas.logo_url is
  'URL del logo. Se muestra en la cabecera de la tienda.';
comment on column shop_tiendas.banner_url is
  'URL del banner de portada.';


-- ---------------------------------------------------------------------
-- 2. Segunda imagen del producto
-- ---------------------------------------------------------------------
-- La primera imagen es la columna `imagen` de la 002; esta es la segunda.
-- Se usan dos columnas y no un jsonb porque son siempre dos: un array
-- abierto invita a meter diez y a que nadie sepa cuál es la principal.
alter table shop_productos add column if not exists imagen_2 text;

comment on column shop_productos.imagen is
  'Imagen principal (URL o emoji de relleno).';
comment on column shop_productos.imagen_2 is
  'Segunda imagen del producto. Se muestra al pasar el ratón en el catálogo.';


-- ---------------------------------------------------------------------
-- 3. Bucket de Storage
-- ---------------------------------------------------------------------
-- Lectura pública (el storefront lo necesita) y sin política de escritura
-- para `anon`: las subidas las hace el servidor con la secret key.
insert into storage.buckets (id, name, public)
values ('shop', 'shop', true)
on conflict (id) do update set public = true;

drop policy if exists shop_imagenes_lectura on storage.objects;
create policy shop_imagenes_lectura on storage.objects
  for select
  using (bucket_id = 'shop');
