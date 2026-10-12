import { NextResponse, type NextRequest } from "next/server";
import {
  leerSesion,
  tieneElModulo,
  esSesionDeSoporte,
  MODULO_ID,
  COOKIE_NAME,
} from "@/lib/acceso/sesion";
import { MODO_DISENO } from "@/lib/modo";

/* =========================================================
   Proxy (middleware) del servicio
   ---------------------------------------------------------
   Qué hace: no deja pintar páginas del panel a quien no tiene sesión,
   y pone las cabeceras de seguridad.

   ⚠️  LO QUE ESTO NO ES
   ---------------------
   No es la barrera de seguridad. Solo evita pintar una página vacía a
   alguien que no tiene sesión.

   La barrera son las políticas de RLS en la base. Aunque alguien llegara
   aquí con una cookie inventada, las consultas con el cliente de
   Supabase no devolverían filas.

   La diferencia: el middleware mejora la experiencia; RLS impide de
   verdad ver datos ajenos. Son dos capas y hacen falta las dos. Con solo
   el middleware, un `searchParams.get("id")` sin comprobar sería un
   fallo de seguridad con todas las apariencias de funcionar.

   Y con soporte sigue siendo cierto: que el proxy deje pasar a un
   member del equipo no le da acceso a nada. Lo que se lo da es la fila
   de `servicio_sesiones` con su `soporte_de`, y eso lo comprueba RLS en
   cada consulta.
   ========================================================= */

/**
 * Rutas públicas.
 *
 * Una sola, normalmente: la que canjea el ticket.
 *
 * Aquí también caen las públicas DE VERDAD del negocio (una página de
 * reservas, un catálogo abierto). Esas las usan clientes finales que no
 * tienen cuenta en ningún sitio, así que no pueden exigir sesión. Lo
 * importante es que lo que sea público sea público a propósito, y que
 * esté en esta lista y no en una excepción repartida por el código.
 */
const PUBLICAS: string[] = ["/entrar", "/tienda"];

function conCabeceras(respuesta: NextResponse): NextResponse {
  /* frame-ancestors 'none' evita el clickjacking sobre acciones que
     cambian datos. */
  respuesta.headers.set("X-Frame-Options", "DENY");
  respuesta.headers.set("X-Content-Type-Options", "nosniff");
  respuesta.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  respuesta.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  const esDev = process.env.NODE_ENV !== "production";

  /* =========================================================
     La CSP, distinta en desarrollo y en producción
     ---------------------------------------------------------
     En producción, cerrada. En desarrollo se abre lo justo para que el
     servidor de Next funcione en TODOS los navegadores: el WebSocket de
     recarga en vivo (`ws:`) y los workers en `blob:` son cosas de dev, y
     si no se permiten, Firefox los bloquea y la recarga en vivo falla.

     `'unsafe-eval'` en dev es por React: su build de desarrollo evalúa
     código. En producción no va.
     ========================================================= */
  const directivas = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'" + (esDev ? " 'unsafe-eval'" : ""),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https: wss:" + (esDev ? " ws:" : ""),
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  if (esDev) directivas.push("worker-src 'self' blob:");

  respuesta.headers.set("Content-Security-Policy", directivas.join("; "));
  return respuesta;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /* ── MODO DISEÑO ────────────────────────────────────────────
     Con el modo diseño encendido se deja pasar todo, para poder ver y
     retocar el shop sin ticket ni sesión. Es TEMPORAL: apagado
     (`NEXT_PUBLIC_MODO_DISENO=0` o build de producción) vuelve este
     mismo fichero a exigir sesión y suscripción, tal cual. */
  if (MODO_DISENO) {
    return conCabeceras(NextResponse.next({ request }));
  }

  /* Las rutas de API se dejan pasar: cada una decide en su interior si
     exige sesión. Una webhook, por ejemplo, no tiene sesión porque la
     llama una máquina, y por eso se valida con una firma. */
  if (pathname.startsWith("/api")) {
    return conCabeceras(NextResponse.next({ request }));
  }

  if (PUBLICAS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return conCabeceras(NextResponse.next({ request }));
  }

  const sesion = await leerSesion(request.cookies.get(COOKIE_NAME)?.value);

  if (!sesion) {
    /* Sin sesión no hay entrada. Se manda a `/entrar` conservando la
       página pedida, con `?next=` para volver a ella después. */
    const destino = new URL("/entrar", request.url);
    destino.searchParams.set("next", pathname);
    return conCabeceras(NextResponse.redirect(destino));
  }

  /* La suscripción se comprueba en cada petición, no solo al entrar. Ver
     la nota larga en exigeSession(): el caso feo del SaaS es el cliente
     que sigue usando lo que ya pagó después de cancelar. */
  if (!esSesionDeSoporte(sesion) && !(await tieneElModulo(sesion.clientId, MODULO_ID))) {
    const r = NextResponse.redirect(new URL("/sin-acceso", request.url));
    r.cookies.delete(COOKIE_NAME);
    return conCabeceras(r);
  }

  return conCabeceras(NextResponse.next({ request }));
}

export const config = {
  /* Sin esto pasa también por los ficheros estáticos y por las
     imágenes, y cada una paga una consulta a la base. */
  matcher: [
    /*
     * ⚠️  ESTO ES LO MÁS IMPORTANTE DEL FICHERO
     *
     * `.*\\..*` saca de la lista todo lo que tiene un punto en el nombre:
     * los .js, .css, las imágenes. Sin eso, una sola página con 40
     * recursos hace 40 consultas a `servicio_sesiones` para comprobar
     * una cookie que no ha cambiado.
     *
     * El coste no es solo la base: cada una de esas consultas es un
     * `await` en el camino crítico de la primera pintura, y por eso la
     * página tarda visiblemente más en un móvil.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};