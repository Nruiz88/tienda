"use server";

import { revalidatePath } from "next/cache";
import { sesionAdmin } from "@/lib/acceso/admin";
import { MODO_DISENO } from "@/lib/modo";
import type { Producto } from "@/lib/shop/tipos";

/* =========================================================
   Escrituras de productos
   ---------------------------------------------------------
   En modo diseño no tocan la base (devuelven ok). En real, escriben con
   la secret key PERO comprobando la pertenencia por `client_id` de la
   sesión: un cliente no puede tocar el producto de otro.
   ========================================================= */

function slugificar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function tiendaDelCliente(clientId: string): Promise<string | null> {
  const { getAdmin } = await import("@/lib/db");
  const { data } = await getAdmin()
    .from("shop_tiendas")
    .select("id")
    .eq("client_id", clientId)
    .maybeSingle();
  return data?.id ?? null;
}

export async function accionCrearProducto(datos: {
  nombre: string;
  descripcion: string;
  categoria: string;
  precioCentavos: number;
  stock: number;
  imagenes: string[];
}) {
  if (MODO_DISENO) return { ok: true as const };

  const sesion = await sesionAdmin();
  const tiendaId = await tiendaDelCliente(sesion.clientId);
  if (!tiendaId) return { ok: false as const, error: "Este cliente todavía no tiene tienda." };

  const { getAdmin } = await import("@/lib/db");
  const admin = getAdmin();

  const slug = `${slugificar(datos.nombre) || "producto"}-${Math.random().toString(36).slice(2, 6)}`;
  const { data: producto, error } = await admin
    .from("shop_productos")
    .insert({
      tienda_id: tiendaId,
      client_id: sesion.clientId,
      slug,
      nombre: datos.nombre,
      descripcion: datos.descripcion || null,
      categoria: datos.categoria,
      imagen: datos.imagenes[0] || null,
      imagen_2: datos.imagenes[1] || null,
      activo: true,
    })
    .select("id")
    .single();
  if (error || !producto) return { ok: false as const, error: error?.message ?? "no se pudo crear" };

  const { error: errorVariante } = await admin.from("shop_variantes").insert({
    producto_id: producto.id,
    tienda_id: tiendaId,
    client_id: sesion.clientId,
    nombre: "Único",
    precio_centavos: datos.precioCentavos,
    stock: datos.stock,
  });
  if (errorVariante) return { ok: false as const, error: errorVariante.message };

  revalidatePath("/productos");
  return { ok: true as const };
}

export async function accionGuardarProducto(p: Producto) {
  if (MODO_DISENO) return { ok: true as const };

  const sesion = await sesionAdmin();
  const { getAdmin } = await import("@/lib/db");
  const admin = getAdmin();

  const { data: actual } = await admin
    .from("shop_productos")
    .select("id, tienda_id")
    .eq("id", p.id)
    .eq("client_id", sesion.clientId)
    .maybeSingle();
  if (!actual) return { ok: false as const, error: "Ese producto no es de este cliente." };

  const { error } = await admin
    .from("shop_productos")
    .update({
      nombre: p.nombre,
      descripcion: p.descripcion || null,
      categoria: p.categoria,
      imagen: p.imagenes[0] || null,
      imagen_2: p.imagenes[1] || null,
    })
    .eq("id", p.id);
  if (error) return { ok: false as const, error: error.message };

  /* Las variantes se reemplazan enteras. El historial de pedidos no se
     rompe: cada línea guarda su propio nombre y precio. */
  await admin.from("shop_variantes").delete().eq("producto_id", p.id);
  if (p.variantes.length) {
    const { error: errorVariantes } = await admin.from("shop_variantes").insert(
      p.variantes.map((v) => ({
        producto_id: p.id,
        tienda_id: actual.tienda_id,
        client_id: sesion.clientId,
        nombre: v.nombre,
        precio_centavos: v.precioCentavos,
        stock: v.stock,
      }))
    );
    if (errorVariantes) return { ok: false as const, error: errorVariantes.message };
  }

  revalidatePath("/productos");
  return { ok: true as const };
}

export async function accionAlternarProducto(id: string, activo: boolean) {
  if (MODO_DISENO) return { ok: true as const };

  const sesion = await sesionAdmin();
  const { getAdmin } = await import("@/lib/db");
  const { error } = await getAdmin()
    .from("shop_productos")
    .update({ activo })
    .eq("id", id)
    .eq("client_id", sesion.clientId);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/productos");
  return { ok: true as const };
}
