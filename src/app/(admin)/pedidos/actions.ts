"use server";

import { revalidatePath } from "next/cache";
import { sesionAdmin } from "@/lib/acceso/admin";
import { MODO_DISENO } from "@/lib/modo";
import { ESTADOS, type EstadoPedido } from "@/lib/shop/tipos";

/* Cambiar el estado de un pedido. En modo diseño no toca la base. En real,
   el `client_id` de la sesión impide tocar el pedido de otro cliente. */
export async function accionCambiarEstadoPedido(id: string, estado: EstadoPedido) {
  if (MODO_DISENO) return { ok: true as const };
  if (!ESTADOS.includes(estado)) return { ok: false as const, error: "Estado no válido." };

  const sesion = await sesionAdmin();
  const { getAdmin } = await import("@/lib/db");
  const { error } = await getAdmin()
    .from("shop_pedidos")
    .update({ estado })
    .eq("id", id)
    .eq("client_id", sesion.clientId);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/pedidos");
  revalidatePath("/");
  return { ok: true as const };
}
