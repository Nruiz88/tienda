import type { ReactNode } from "react";
import { Marco } from "@/components/marco";
import { AltaTienda } from "@/components/admin/alta-tienda";
import { sesionAdmin } from "@/lib/acceso/admin";
import { obtenerTiendaDelCliente } from "@/lib/shop/catalogo";
import { MODO_DISENO, TIENDA_DEMO } from "@/lib/modo";

/* Layout del admin. Aquí se exige la sesión (o la de diseño) y se resuelve
   la tienda DEL CLIENTE de la sesión.

   Si el cliente todavía no tiene tienda (y no estamos en modo diseño), en
   vez de un panel vacío se le pide crearla. */
export default async function LayoutAdmin({ children }: { children: ReactNode }) {
  const sesion = await sesionAdmin();
  const tienda = await obtenerTiendaDelCliente(sesion.clientId);

  if (!MODO_DISENO && !tienda) {
    return <AltaTienda />;
  }

  return <Marco tiendaSlug={tienda?.slug ?? TIENDA_DEMO}>{children}</Marco>;
}
