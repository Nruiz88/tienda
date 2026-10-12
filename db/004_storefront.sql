-- ================================================================
-- 004 — Storefront público y alta de pedidos
-- ------------------------------------------------------------
-- El storefront lo ve un comprador ANÓNIMO: no tiene ticket, ni sesión,
-- ni cuenta. Eso obliga a dos cosas:

--   1. LECTURA pública, pero SOLO de lo que es público: las tiendas
--      activas y sus productos activos. Nada de pedidos.
--   2. ESCRITURA por una función `security definer` (`shop_crear_pedido`)
--      que vuelve a leer el precio y el stock de la base. El navegador
--      manda una INTENCIÓN (qué variante y cuánta cantidad), nunca el
--      precio: si mandara el precio, cualquiera compraría a $1.
-- ================================================================


-- ---------------------------------------------------------------------
-- 1. Lectura pública
-- ---------------------------------------------------------------------
-- `enable row level security` ya está en la 002/003. Aquí se AÑADEN
-- políticas para `anon`. Sin ellas, RLS lo deja fuera (que es el
-- comportamiento por defecto correcto).

create policy shop_tiendas_publico on shop_tiendas
  for select
  to anon
  using (activo);

create policy shop_productos_publico on shop_productos
  for select
  to anon
  using (
    activo
    and exists (
      select 1 from shop_tiendas t
      where t.id = tienda_id and t.activo
    )
  );

create policy shop_variantes_publico on shop_variantes
  for select
  to anon
  using (
    exists (
      select 1
      from shop_productos p
      join shop_tiendas t on t.id = p.tienda_id
      where p.id = producto_id and p.activo and t.activo
    )
  );

-- ⚠️  NO hay política para `shop_pedidos` ni `shop_pedido_lineas`.
--     A propósito: ni `anon` ni `authenticated` leen pedidos por aquí.
--     El admin los lee con la sesión del ticket y RLS por `client_id`.


-- ---------------------------------------------------------------------
-- 2. Alta de pedido (security definer)
-- ---------------------------------------------------------------------
create or replace function public.shop_crear_pedido(
  p_slug       text,
  p_cliente    text,
  p_telefono   text,
  p_email      text,
  p_direccion  text,
  p_lineas     jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tienda    shop_tiendas%rowtype;
  v_numero    bigint;
  v_total     integer := 0;
  v_pedido_id uuid;
  v_linea     jsonb;
  v_variante  shop_variantes%rowtype;
  v_cantidad  integer;
  v_salida    jsonb;
begin
  /* Validación de forma. El precio NO se valida aquí porque no llega. */
  if p_cliente is null or length(btrim(p_cliente)) = 0 then
    raise exception 'Falta el nombre del cliente';
  end if;
  if p_lineas is null or jsonb_typeof(p_lineas) <> 'array' or jsonb_array_length(p_lineas) = 0 then
    raise exception 'El carrito está vacío';
  end if;
  if jsonb_array_length(p_lineas) > 100 then
    raise exception 'El pedido es demasiado grande';
  end if;

  select * into v_tienda
  from shop_tiendas
  where slug = p_slug and activo
  limit 1;
  if not found then
    raise exception 'La tienda no existe o está inactiva';
  end if;

  /* Se bloquea la fila de la tienda: serializa la numeración por tienda
     bajo concurrencia (dos pedidos a la vez no cogen el mismo número). */
  perform 1 from shop_tiendas where id = v_tienda.id for update;

  select coalesce(max(numero), 0) + 1 into v_numero
  from shop_pedidos
  where tienda_id = v_tienda.id;

  insert into shop_pedidos (
    tienda_id, client_id, numero, cliente, telefono, email, direccion, estado, total_centavos
  ) values (
    v_tienda.id, v_tienda.client_id, v_numero,
    btrim(p_cliente),
    nullif(btrim(coalesce(p_telefono, '')), ''),
    nullif(btrim(coalesce(p_email, '')), ''),
    nullif(btrim(coalesce(p_direccion, '')), ''),
    'pendiente', 0
  )
  returning id into v_pedido_id;

  for v_linea in select * from jsonb_array_elements(p_lineas) loop
    v_cantidad := greatest(1, coalesce((v_linea->>'cantidad')::int, 1));

    /* El precio y el stock salen de la BASE, no del navegador. */
    select * into v_variante
    from shop_variantes
    where id = (v_linea->>'varianteId')::uuid
      and tienda_id = v_tienda.id
    for update;
    if not found then
      raise exception 'Una variante del pedido no existe en esta tienda';
    end if;
    if v_variante.stock < v_cantidad then
      raise exception 'Sin stock suficiente de %', v_variante.nombre;
    end if;

    update shop_variantes
      set stock = stock - v_cantidad
      where id = v_variante.id;

    insert into shop_pedido_lineas (
      pedido_id, tienda_id, client_id,
      producto_id, variante_id, nombre, variante, precio_centavos, cantidad
    ) values (
      v_pedido_id, v_tienda.id, v_tienda.client_id,
      v_variante.producto_id, v_variante.id,
      coalesce(nullif(v_linea->>'nombre', ''), v_variante.nombre),
      v_variante.nombre, v_variante.precio_centavos, v_cantidad
    );

    v_total := v_total + v_variante.precio_centavos * v_cantidad;
  end loop;

  update shop_pedidos set total_centavos = v_total where id = v_pedido_id;

  select jsonb_build_object(
    'id', p.id,
    'numero', p.numero,
    'cliente', p.cliente,
    'telefono', coalesce(p.telefono, ''),
    'email', coalesce(p.email, ''),
    'direccion', coalesce(p.direccion, ''),
    'creadoEn', p.creado_en,
    'estado', p.estado,
    'totalCentavos', p.total_centavos,
    'lineas', coalesce((
      select jsonb_agg(jsonb_build_object(
        'productoId', l.producto_id,
        'varianteId', l.variante_id,
        'nombre', l.nombre,
        'variante', l.variante,
        'precioCentavos', l.precio_centavos,
        'cantidad', l.cantidad
      ))
      from shop_pedido_lineas l
      where l.pedido_id = p.id
    ), '[]'::jsonb)
  ) into v_salida
  from shop_pedidos p
  where p.id = v_pedido_id;

  return v_salida;
end;
$$;

comment on function public.shop_crear_pedido is
  'Alta de pedido del storefront público. security definer: valida stock y lee el precio de la base, escribe pedido + líneas y descuenta stock en una transacción.';

grant execute on function public.shop_crear_pedido(text, text, text, text, text, jsonb)
  to anon, authenticated;
