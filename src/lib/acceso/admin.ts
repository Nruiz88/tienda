import { cache } from "react";
import { redirect } from "next/navigation";
import {
  esSesionDeSoporte,
  getSession,
  tieneElModulo,
  MODULO_ID,
  type Sesion,
} from "@/lib/acceso/sesion";
import { MODO_DISENO } from "@/lib/modo";

/* =========================================================
   La sesión del ADMIN
   ---------------------------------------------------------
   Es la puerta del lado del dueño de la tienda. La tienda PÚBLICA
   (`/tienda/[slug]`) no pasa por aquí: la ve un comprador anónimo.

   ── LOS DOS MODOS ──
   · Modo diseño (encendido): devuelve una sesión falsa, para poder ver y
     retocar el admin sin ticket ni base.
   · Modo real (apagado): exige la sesión del ticket. Si no la hay, manda
     a `/entrar`; si el cliente no tiene el módulo, a `/sin-acceso`.

   ── POR QUÉ ACÁ Y NO EN CADA PÁGINA ──
   Se llama desde el layout del admin Y desde cada página. Para que eso no
   sea dos consultas, va envuelto en `cache()` de React: dentro de una
   misma petición, las dos llamadas comparten el resultado.

   ── LA TIENDA SALE DE `clientId`, NO DE LA URL ──
   Un solo deploy atiende a todos los clientes. Si la tienda que se
   administra saliera de la URL, cualquiera vería la de otro. Sale del
   `clientId` de la sesión, y el RLS filtra por él.
   ========================================================= */

const SESION_DISENO: Sesion = {
  userId: "00000000-0000-0000-0000-0000000000d0",
  clientId: "00000000-0000-0000-0000-0000000000c1",
  rol: "client",
  accessToken: "",
  csrfToken: "diseno",
  expiraEn: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
};

export const sesionAdmin = cache(async (): Promise<Sesion> => {
  if (MODO_DISENO) return SESION_DISENO;

  const sesion = await getSession();
  if (!sesion) redirect("/entrar?next=%2F");

  /* La suscripción se comprueba aquí igual que en el proxy: el proxy evita
     pintar la página, esto es la segunda capa. El staff (soporte) pasa. */
  if (!esSesionDeSoporte(sesion) && !(await tieneElModulo(sesion.clientId, MODULO_ID))) {
    redirect("/sin-acceso");
  }

  return sesion;
});
