/* =========================================================
   Modo diseño
   ---------------------------------------------------------
   ESTO ES UN INTERRUPTOR TEMPORAL. Está para poder ver y retocar el
   diseño del shop SIN pasar por el ticket del panel: sin sesión, sin
   Coolify, sin Supabase.

   Cómo se decide:
     · NEXT_PUBLIC_MODO_DISENO=1  → encendido (aunque sea producción)
     · NEXT_PUBLIC_MODO_DISENO=0  → apagado (aunque sea desarrollo)
     · sin la variable             → encendido SOLO en desarrollo

   ⚠️  POR QUÉ NO SE PUEDE QUEDAR ENCENDIDO EN PRODUCCIÓN
   ------------------------------------------------------
   Con el modo diseño encendido, `proxy.ts` deja pasar a cualquiera y las
   consultas devuelven datos de mentira. En producción eso es un shop
   abierto sin control. Por eso el valor por defecto NO es "siempre
   encendido": es "encendido solo con NODE_ENV=development".

   Para probar el flujo real del ticket: `NEXT_PUBLIC_MODO_DISENO=0`.
   ========================================================= */

const pedido = process.env.NEXT_PUBLIC_MODO_DISENO;

export const MODO_DISENO: boolean =
  pedido === "1" ? true : pedido === "0" ? false : process.env.NODE_ENV !== "production";

/** El nombre de la tienda de demostración (una sola, para el preview). */
export const TIENDA_DEMO = "demo";
