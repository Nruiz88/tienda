import { MODO_DISENO } from "@/lib/modo";
import { PEDIDOS, PRODUCTOS, TIENDA } from "./demo";
import type { EstadoPedido, LineaPedido, Pedido, Producto, Tienda } from "./tipos";

/* =========================================================
   Acceso a los datos del shop
   ---------------------------------------------------------
   Un solo sitio por el que pasan las páginas. Tiene DOS carriles:

   · MODO DISEÑO (encendido): devuelve los datos de `demo.ts`. Es para
     ver y retocar el diseño sin Supabase, sin ticket y sin sesión.

   · REAL (apagado): lee de Supabase.
       - La TIENDA PÚBLICA lee por `slug` (comprador anónimo).
       - El ADMIN lee por `client_id` (el dueño), y cuando el ticket esté
         encendido sus escrituras tienen que ir con `getScoped` + RLS.
     Ver `db/002_tienda.sql` y `db/004_storefront.sql`.

   ⚠️  EL `import` DE `@/lib/db` ES DINÁMICO A PROPÓSITO
   ----------------------------------------------------
   `db.ts` avisa por consola si faltan las variables. Importándolo dentro
   del carril real, en modo diseño no se carga ni avisa.
   ========================================================= */

/* ── Tienda ────────────────────────────────────────────────────────── */

/** La tienda por su slug público (storefront). */
export async function obtenerTienda(slug: string): Promise<Tienda | null> {
  if (MODO_DISENO) {
    return slug === TIENDA.slug ? TIENDA : { ...TIENDA, slug };
  }

  const { getAdmin } = await import("@/lib/db");
  const { data, error } = await getAdmin()
    .from("shop_tiendas")
    .select("slug, nombre, descripcion, logo_url, banner_url")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return {
    slug: data.slug,
    nombre: data.nombre,
    descripcion: data.descripcion ?? "",
    logoUrl: data.logo_url ?? "",
    bannerUrl: data.banner_url ?? "",
  };
}

/** La tienda del cliente que tiene la sesión (admin). Sale del `clientId`,
    NUNCA de la URL. */
export async function obtenerTiendaDelCliente(clientId: string): Promise<Tienda | null> {
  if (MODO_DISENO) return TIENDA;

  const { getAdmin } = await import("@/lib/db");
  const { data, error } = await getAdmin()
    .from("shop_tiendas")
    .select("slug, nombre, descripcion, logo_url, banner_url")
    .eq("client_id", clientId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    slug: data.slug,
    nombre: data.nombre,
    descripcion: data.descripcion ?? "",
    logoUrl: data.logo_url ?? "",
    bannerUrl: data.banner_url ?? "",
  };
}

/* ── Productos ─────────────────────────────────────────────────────── */

/** Productos para el storefront: solo los activos. */
export async function listarProductos(slug: string): Promise<Producto[]> {
  const todos = await listarProductosDeTienda(slug);
  return todos.filter((p) => p.activo);
}

/** Productos para el admin: todos, también los desactivados. */
export async function listarProductosAdmin(clientId: string): Promise<Producto[]> {
  if (MODO_DISENO) return PRODUCTOS;
  const tienda = await obtenerTiendaDelCliente(clientId);
  if (!tienda) return [];
  return listarProductosDeTienda(tienda.slug);
}

export async function obtenerProducto(slug: string, productoSlug: string): Promise<Producto | null> {
  const productos = await listarProductosDeTienda(slug);
  return productos.find((p) => p.slug === productoSlug) ?? null;
}

async function listarProductosDeTienda(slug: string): Promise<Producto[]> {
  if (MODO_DISENO) return PRODUCTOS;

  const { getAdmin } = await import("@/lib/db");
  const admin = getAdmin();

  const { data: tiendas } = await admin
    .from("shop_tiendas")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!tiendas) return [];

  const { data: productos, error } = await admin
    .from("shop_productos")
    .select("id, slug, nombre, descripcion, categoria, imagen, imagen_2, activo, shop_variantes(id, nombre, precio_centavos, stock)")
    .eq("tienda_id", tiendas.id)
    .order("nombre");
  if (error || !productos) return [];

  return (productos as any[]).map((p) => ({
    id: p.id,
    slug: p.slug,
    nombre: p.nombre,
    descripcion: p.descripcion ?? "",
    categoria: p.categoria ?? "General",
    imagenes: [p.imagen, p.imagen_2].filter(Boolean) as string[],
    activo: p.activo,
    variantes: (p.shop_variantes ?? []).map((v: any) => ({
      id: v.id,
      nombre: v.nombre,
      precioCentavos: v.precio_centavos,
      stock: v.stock,
    })),
  }));
}

/* ── Pedidos ───────────────────────────────────────────────────────── */

/** Pedidos del admin. `clientId` acota el resultado al cliente de la
    sesión; cuando el ticket esté encendido, RLS hace además su parte. */
export async function listarPedidos(clientId?: string): Promise<Pedido[]> {
  if (MODO_DISENO) {
    return [...PEDIDOS].sort((a, b) => b.numero - a.numero);
  }

  const { getAdmin } = await import("@/lib/db");
  let consulta = getAdmin()
    .from("shop_pedidos")
    .select("id, numero, cliente, telefono, email, direccion, creado_en, estado, total_centavos, shop_pedido_lineas(producto_id, variante_id, nombre, variante, precio_centavos, cantidad)")
    .order("numero", { ascending: false });
  if (clientId) consulta = consulta.eq("client_id", clientId);

  const { data, error } = await consulta;
  if (error || !data) return [];

  return (data as any[]).map((o) => ({
    id: o.id,
    numero: o.numero,
    cliente: o.cliente,
    telefono: o.telefono ?? "",
    email: o.email ?? "",
    direccion: o.direccion ?? "",
    creadoEn: o.creado_en,
    estado: o.estado as EstadoPedido,
    totalCentavos: o.total_centavos,
    lineas: (o.shop_pedido_lineas ?? []) as LineaPedido[],
  }));
}

export async function obtenerPedido(id: string, clientId?: string): Promise<Pedido | null> {
  const pedidos = await listarPedidos(clientId);
  return pedidos.find((p) => p.id === id) ?? null;
}

/* ── Alta de pedido (storefront) ───────────────────────────────────── */

export interface AltaPedido {
  /** Slug de la tienda donde se compra (storefront público). */
  slug: string;
  cliente: string;
  telefono: string;
  email: string;
  direccion: string;
  lineas: LineaPedido[];
}

/**
 * Crea un pedido.
 *
 * En modo diseño devuelve uno inventado. En real llama a la RPC
 * `shop_crear_pedido`, que es `security definer`: valida stock y
 * pertenencia y escribe pedido + líneas en UNA transacción. No se hace
 * con `insert()` desde aquí a propósito: un insert anónimo directo
 * abriría la tabla de pedidos al storefront público.
 */
export async function crearPedido(datos: AltaPedido): Promise<Pedido> {
  const total = datos.lineas.reduce((s, l) => s + l.precioCentavos * l.cantidad, 0);

  if (MODO_DISENO) {
    const numero = Math.max(...PEDIDOS.map((p) => p.numero)) + 1;
    return {
      id: "o-" + numero,
      numero,
      cliente: datos.cliente,
      telefono: datos.telefono,
      email: datos.email,
      direccion: datos.direccion,
      creadoEn: new Date().toISOString(),
      estado: "pendiente",
      totalCentavos: total,
      lineas: datos.lineas,
    };
  }

  const { getAdmin } = await import("@/lib/db");
  const { data, error } = await getAdmin().rpc("shop_crear_pedido", {
    p_slug: datos.slug,
    p_cliente: datos.cliente,
    p_telefono: datos.telefono,
    p_email: datos.email,
    p_direccion: datos.direccion,
    p_lineas: datos.lineas,
  });
  if (error) throw new Error("No se pudo crear el pedido: " + error.message);
  return data as Pedido;
}

/* ── Listados paginados (admin) ────────────────────────────────────
   Traen UNA página y el total. Así el admin no carga todo el catálogo ni
   todos los pedidos de golpe cuando crezcan. */

export interface Pagina<T> {
  items: T[];
  total: number;
}

function filaAProducto(p: any): Producto {
  return {
    id: p.id,
    slug: p.slug,
    nombre: p.nombre,
    descripcion: p.descripcion ?? "",
    categoria: p.categoria ?? "General",
    imagenes: [p.imagen, p.imagen_2].filter(Boolean) as string[],
    activo: p.activo,
    variantes: (p.shop_variantes ?? []).map((v: any) => ({
      id: v.id,
      nombre: v.nombre,
      precioCentavos: v.precio_centavos,
      stock: v.stock,
    })),
  };
}

export async function paginaProductos(opts: {
  clientId: string;
  q?: string;
  pagina?: number;
  porPagina?: number;
}): Promise<Pagina<Producto>> {
  const porPagina = opts.porPagina ?? 20;
  const pagina = Math.max(1, opts.pagina ?? 1);

  if (MODO_DISENO) {
    const filtrados = PRODUCTOS.filter(
      (p) => !opts.q || `${p.nombre} ${p.categoria}`.toLowerCase().includes(opts.q.toLowerCase())
    ).sort((a, b) => a.nombre.localeCompare(b.nombre));
    const desde = (pagina - 1) * porPagina;
    return { items: filtrados.slice(desde, desde + porPagina), total: filtrados.length };
  }

  const { getAdmin } = await import("@/lib/db");
  const desde = (pagina - 1) * porPagina;
  let consulta = getAdmin()
    .from("shop_productos")
    .select(
      "id, slug, nombre, descripcion, categoria, imagen, imagen_2, activo, shop_variantes(id, nombre, precio_centavos, stock)",
      { count: "exact" }
    )
    .eq("client_id", opts.clientId)
    .order("nombre")
    .range(desde, desde + porPagina - 1);

  if (opts.q?.trim()) {
    const patron = `%${opts.q.trim().replace(/[%_]/g, (m) => "\\" + m)}%`;
    consulta = consulta.or(`nombre.ilike.${patron},categoria.ilike.${patron}`);
  }

  const { data, count, error } = await consulta;
  if (error || !data) return { items: [], total: 0 };
  return { items: (data as any[]).map(filaAProducto), total: count ?? 0 };
}

export async function paginaPedidos(opts: {
  clientId: string;
  q?: string;
  estado?: EstadoPedido | "todos";
  pagina?: number;
  porPagina?: number;
}): Promise<Pagina<Pedido>> {
  const porPagina = opts.porPagina ?? 20;
  const pagina = Math.max(1, opts.pagina ?? 1);

  if (MODO_DISENO) {
    const filtrados = PEDIDOS.filter(
      (p) =>
        (!opts.estado || opts.estado === "todos" || p.estado === opts.estado) &&
        (!opts.q || `${p.numero} ${p.cliente}`.toLowerCase().includes(opts.q.toLowerCase()))
    ).sort((a, b) => b.numero - a.numero);
    const desde = (pagina - 1) * porPagina;
    return { items: filtrados.slice(desde, desde + porPagina), total: filtrados.length };
  }

  const { getAdmin } = await import("@/lib/db");
  const desde = (pagina - 1) * porPagina;
  let consulta = getAdmin()
    .from("shop_pedidos")
    .select(
      "id, numero, cliente, telefono, email, direccion, creado_en, estado, total_centavos, shop_pedido_lineas(producto_id, variante_id, nombre, variante, precio_centavos, cantidad)",
      { count: "exact" }
    )
    .eq("client_id", opts.clientId)
    .order("numero", { ascending: false })
    .range(desde, desde + porPagina - 1);

  if (opts.estado && opts.estado !== "todos") consulta = consulta.eq("estado", opts.estado);
  if (opts.q?.trim()) {
    const q = opts.q.trim();
    const patron = `%${q.replace(/[%_]/g, (m) => "\\" + m)}%`;
    consulta = /^\d+$/.test(q)
      ? consulta.or(`cliente.ilike.${patron},numero.eq.${Number(q)}`)
      : consulta.or(`cliente.ilike.${patron}`);
  }

  const { data, count, error } = await consulta;
  if (error || !data) return { items: [], total: 0 };
  return {
    items: (data as any[]).map((o) => ({
      id: o.id,
      numero: o.numero,
      cliente: o.cliente,
      telefono: o.telefono ?? "",
      email: o.email ?? "",
      direccion: o.direccion ?? "",
      creadoEn: o.creado_en,
      estado: o.estado as EstadoPedido,
      totalCentavos: o.total_centavos,
      lineas: (o.shop_pedido_lineas ?? []) as LineaPedido[],
    })),
    total: count ?? 0,
  };
}
