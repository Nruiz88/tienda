-- ================================================================
-- 002 — Catálogo del mini-shop
-- ------------------------------------------------------------
-- Una tienda por cliente, con sus productos y variantes. Todo cuelga de
-- `client_id`, que es el mismo de `clients` del panel: el aislamiento es
-- el mismo que en el resto de la plataforma.

--   ⚠️  LOS ÍNDICES LLEVAN `client_id` PRIMERO
--   -----------------------------------------
--   Las políticas RLS añaden `client_id = ...` a CADA consulta. Sin un
--   índice que empiece por `client_id`, Postgres hace un recorrido
--   completo de la tabla en cada lectura, y con muchos clientes eso es
--   lo primero que se cae. Ver la ADR de tenancy.

--   ⚠️  EL NÚMERO DE PEDIDO ES POR TIENDA
--   -----------------------------------
--   No global: si fuera global, un cliente vería el volumen de pedidos
--   de los demás por el salto entre dos números suyos.
-- ================================================================


-- ---------------------------------------------------------------------
-- 0. Quién es el cliente de esta sesión
-- ---------------------------------------------------------------------
-- Mismo patrón que `es_cliente_de()` del panel: `security definer` +
-- `search_path` fijo, para que la política no dependa de permisos del
-- usuario ni se pueda usar para leer de más.
create or replace function public.shop_cliente_actual()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select client_id
  from profiles
  where id = auth.uid()
    and activo
  limit 1;
$$;


-- ---------------------------------------------------------------------
-- 1. Tienda (una por cliente)
-- ---------------------------------------------------------------------
create table if not exists shop_tiendas (
  id          uuid primary key default gen_random_uuid(),

  client_id   uuid not null references clients on delete cascade,

  /* El slug es la dirección pública: /tienda/<slug>. Se elige al dar de
     alta el módulo y no debería cambiar, porque rompe enlaces. */
  slug        text not null,
  nombre      text not null,
  descripcion text,

  activo      boolean not null default true,
  creado_en   timestamptz not null default now(),

  /* Un cliente, una tienda. Si algún día un cliente necesita dos, esto
     se quita y pasa a ser único (client_id, slug). */
  unique (client_id),
  unique (slug)
);

comment on table shop_tiendas is
  'Una tienda por cliente del panel. `slug` es la dirección pública (/tienda/<slug>).';

create index if not exists ix_shop_tiendas_client on shop_tiendas (client_id);
-- El slug ya tiene índice por el unique.

alter table shop_tiendas enable row level security;

create policy shop_tiendas_admin on shop_tiendas
  for all
  using (client_id = public.shop_cliente_actual())
  with check (client_id = public.shop_cliente_actual());


-- ---------------------------------------------------------------------
-- 2. Productos
-- ---------------------------------------------------------------------
create table if not exists shop_productos (
  id          uuid primary key default gen_random_uuid(),

  tienda_id   uuid not null references shop_tiendas on delete cascade,
  /* Desnormalizado A PROPÓSITO: las políticas RLS filtran por client_id,
     y sin esta columna cada política tendría que hacer un join a
     shop_tiendas por fila. Es la diferencia entre un índice y un join
     por cada fila leída. */
  client_id   uuid not null references clients on delete cascade,

  slug        text not null,
  nombre      text not null,
  descripcion text,
  categoria   text not null default 'General',
  imagen      text,
  activo      boolean not null default true,
  creado_en   timestamptz not null default now(),

  unique (tienda_id, slug)
);

comment on table shop_productos is
  'Productos de cada tienda. `client_id` va desnormalizado para que RLS filtre sin join.';

create index if not exists ix_shop_productos_client_activo
  on shop_productos (client_id, activo);
create index if not exists ix_shop_productos_tienda_categoria
  on shop_productos (tienda_id, categoria);

alter table shop_productos enable row level security;

create policy shop_productos_admin on shop_productos
  for all
  using (client_id = public.shop_cliente_actual())
  with check (client_id = public.shop_cliente_actual());


-- ---------------------------------------------------------------------
-- 3. Variantes
-- ---------------------------------------------------------------------
create table if not exists shop_variantes (
  id              uuid primary key default gen_random_uuid(),

  producto_id     uuid not null references shop_productos on delete cascade,
  tienda_id       uuid not null references shop_tiendas on delete cascade,
  client_id       uuid not null references clients on delete cascade,

  nombre          text not null,
  /* Los importes van en CENTAVOS enteros: sumar floats da céntimos
     perdidos, y una caja que no cuadra por un peso no se explica. */
  precio_centavos integer not null check (precio_centavos >= 0),
  stock           integer not null default 0 check (stock >= 0),

  creado_en       timestamptz not null default now()
);

comment on table shop_variantes is
  'Presentaciones de un producto (250 g, 1 kg…). El stock vive aquí y la RPC de pedido lo descuenta.';

create index if not exists ix_shop_variantes_producto on shop_variantes (producto_id);
create index if not exists ix_shop_variantes_client on shop_variantes (client_id);

alter table shop_variantes enable row level security;

create policy shop_variantes_admin on shop_variantes
  for all
  using (client_id = public.shop_cliente_actual())
  with check (client_id = public.shop_cliente_actual());
