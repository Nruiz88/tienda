"use server";

import { revalidatePath } from "next/cache";
import { sesionAdmin } from "@/lib/acceso/admin";
import { guardarConfiguracion, type DatosConfig } from "@/lib/shop/configuracion";

/* Guarda la configuración del cliente de la sesión. El `clientId` sale de
   la sesión, NUNCA del navegador: si viniera del formulario, un cliente
   podría escribir la configuración de otro. */
export async function accionGuardarConfiguracion(datos: DatosConfig) {
  const sesion = await sesionAdmin();
  await guardarConfiguracion(sesion.clientId, datos);
  revalidatePath("/configuracion");
  return { ok: true as const };
}
