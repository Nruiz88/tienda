"use server";

import { revalidatePath } from "next/cache";
import { sesionAdmin } from "@/lib/acceso/admin";
import { MODO_DISENO } from "@/lib/modo";
import { slugificar } from "@/lib/shop/slug";

/* =========================================================
   Alta de tienda
   ---------------------------------------------------------
   Un cliente tiene el módulo contratado pero todavía no tiene tienda. Al
   entrar al admin, en vez de un panel vacío, se le pide crear la suya:
   nombre, dirección (slug) y, si quiere, productos de ejemplo.

   El `client_id` sale de la SESIÓN: nadie crea la tienda de otro.
   ========================================================= */

const RESERVADOS = new Set([
  "admin",
  "api",
  "tienda",
  "entrar",
  "sin-acceso",
  "_next",
  "productos",
  "pedidos",
  "configuracion",
  "bienvenida",
]);

/** Productos de ejemplo para que la tienda no arranque vacía. */
const SEMILLA = [
  { nombre: "Camisa de lino", categoria: "Hombre", imagen: "👔", precio: 58000, stock: 8 },
  { nombre: "Remera de algodón", categoria: "Hombre", imagen: "👕", precio: 24000, stock: 20 },
  { nombre: "Vestido midi", categoria: "Mujer", imagen: "👗", precio: 72000, stock: 6 },
  { nombre: "Sweater de lana", categoria: "Mujer", imagen: "🧶", precio: 46000, stock: 9 },
  { nombre: "Zapatillas de lona", categoria: "Calzado", imagen: "👟", precio: 89000, stock: 12 },
  { nombre: "Gorra de sarga", categoria: "Accesorios", imagen: "🧢", precio: 18000, stock: 25 },
];

export async function accionCrearMiTienda(datos: {
  nombre: string;
  slug: string;
  descripcion: string;
  conEjemplo: boolean;
}) {
  if (MODO_DISENO) return { ok: true as const, slug: slugificar(datos.slug || datos.nombre) };

  const sesion = await sesionAdmin();
  const { getAdmin } = await import("@/lib/db");
  const admin = getAdmin();

  const nombre = datos.nombre.trim();
  if (nombre.length < 2) return { ok: false as const, error: "Poné un nombre para la tienda." };

  let slug = slugificar(datos.slug || datos.nombre);
  if (!slug || RESERVADOS.has(slug)) {
    return { ok: false as const, error: "Ese identificador no se puede usar. Probá otro." };
  }

  const { data: existente } = await admin
    .from("shop_tiendas")
    .select("id")
    .eq("client_id", sesion.clientId)
    .maybeSingle();
  if (existente) return { ok: false as const, error: "Este cliente ya tiene una tienda." };

  /* Si el slug está tomado, se le añade un sufijo corto en vez de fallar. */
  const { data: choque } = await admin.from("shop_tiendas").select("id").eq("slug", slug).maybeSingle();
  if (choque) slug = `${slug}-${Math.random().toString(36).slice(2, 5)}`;

  const { data: tienda, error } = await admin
    .from("shop_tiendas")
    .insert({
      client_id: sesion.clientId,
      slug,
      nombre,
      descripcion: datos.descripcion.trim() || null,
      activo: true,
    })
    .select("id")
    .single();
  if (error || !tienda) return { ok: false as const, error: error?.message ?? "No se pudo crear la tienda." };

  if (datos.conEjemplo) {
    for (const p of SEMILLA) {
      const { data: producto } = await admin
        .from("shop_productos")
        .insert({
          tienda_id: tienda.id,
          client_id: sesion.clientId,
          slug: `${slugificar(p.nombre)}-${Math.random().toString(36).slice(2, 5)}`,
          nombre: p.nombre,
          categoria: p.categoria,
          imagen: p.imagen,
          activo: true,
        })
        .select("id")
        .single();
      if (producto) {
        await admin.from("shop_variantes").insert({
          producto_id: producto.id,
          tienda_id: tienda.id,
          client_id: sesion.clientId,
          nombre: "Único",
          precio_centavos: p.precio * 100,
          stock: p.stock,
        });
      }
    }
  }

  revalidatePath("/", "layout");
  return { ok: true as const, slug };
}
