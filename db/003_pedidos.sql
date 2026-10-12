-- ================================================================
-- 003 — Pedidos del mini-shop
-- ------------------------------------------------------------
-- Cabecera + líneas. Aquí NO hay políticas para el navegador sin sesión
-- (el comprador es anónimo): el pedido entra siempre por la RPC
-- `shop_crear_pedido` de la migración 004, que es `security definer` y
-- vuelve a leer el precio de la base.

--   ⚠️  FALTÓ UN TRIGGER Y NO SE NOTÓ
--   --------------------------------
--   El descuento de stock y el alta de la línea van en la MISMA
--   transacción de la RPC, no en un trigger aparte. Un trigger que no
--   dispara no da error: el pedido se guarda, el stock no baja, y nadie
--   se entera hasta que se vende más de lo que había. Por eso se prueba
--   contra la base, no solo con tipos.
-- ================================================================


-- ---------------------------------------------------------------------
-- 1. Cabecera del pedido
-- ---------------------------------------------------------------------
create table if not exists shop_pedidos (
  id              uuid primary key default gen_random_uuid(),

  tienda_id       uuid not null references shop_tiendas on delete cascade,
  client_id       uuid not null references clients on delete cascade,

  /* Numeración POR TIENDA. Ver la nota de la 002. */
  numero          bigint not null,

  cliente         text not null,
  telefono        text,
  email           text,
  direccion       text,

  estado          text not null default 'pendiente'
                  check (estado in ('pendiente','pagado','enviado','entregado','cancelado')),

  total_centavos  integer not null default 0 check (total_centavos >= 0),

  creado_en       timestamptz not null default now(),

  unique (tienda_id, numero)
);

comment on table shop_pedidos is
  'Pedidos de cada tienda. Entran por la RPC shop_crear_pedido (004), nunca por insert anónimo directo.';

create index if not exists ix_shop_pedidos_client_creado
  on shop_pedidos (client_id, creado_en desc);
create index if not exists ix_shop_pedidos_tienda_numero
  on shop_pedidos (tienda_id, numero desc);
/* Lo que más se consulta en el admin: los que están sin cerrar. */
create index if not exists ix_shop_pedidos_pendientes
  on shop_pedidos (client_id, creado_en desc)
  where estado in ('pendiente','pagado');

alter table shop_pedidos enable row level security;

create policy shop_pedidos_admin on shop_pedidos
  for all
  using (client_id = public.shop_cliente_actual())
  with check (client_id = public.shop_cliente_actual());


-- ---------------------------------------------------------------------
-- 2. Líneas
-- ---------------------------------------------------------------------
create table if not exists shop_pedido_lineas (
  id              uuid primary key default gen_random_uuid(),

  pedido_id       uuid not null references shop_pedidos on delete cascade,
  tienda_id       uuid not null references shop_tiendas on delete cascade,
  client_id       uuid not null references clients on delete cascade,

  /* `set null`: si se borra un producto, el pedido histórico tiene que
     seguir diciendo qué se vendió. El nombre y el precio se copian
     abajo justamente para eso. */
  producto_id     uuid references shop_productos on delete set null,
  variante_id     uuid references shop_variantes on delete set null,

  /* Copiados al confirmar: un cambio de precio posterior no reescribe un
     pedido viejo. */
  nombre          text not null,
  variante        text,
  precio_centavos integer not null check (precio_centavos >= 0),
  cantidad        integer not null check (cantidad > 0)
);

comment on table shop_pedido_lineas is
  'Líneas del pedido. Nombre y precio se copian al confirmar para que un cambio posterior no reescriba la historia.';

create index if not exists ix_shop_pedido_lineas_pedido on shop_pedido_lineas (pedido_id);
create index if not exists ix_shop_pedido_lineas_client on shop_pedido_lineas (client_id);

alter table shop_pedido_lineas enable row level security;

create policy shop_pedido_lineas_admin on shop_pedido_lineas
  for all
  using (client_id = public.shop_cliente_actual())
  with check (client_id = public.shop_cliente_actual());
