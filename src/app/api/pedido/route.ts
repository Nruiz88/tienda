import { NextResponse } from "next/server";
import { MODO_DISENO } from "@/lib/modo";
import { crearPedido, obtenerTienda } from "@/lib/shop/catalogo";
import { obtenerAccessTokenMercadopago, obtenerConfiguracionPublica } from "@/lib/shop/configuracion";
import { crearPreferencia } from "@/lib/shop/pagos";
import { enviarEmailsPedido } from "@/lib/email";
import type { LineaPedido } from "@/lib/shop/tipos";

/* =========================================================
   POST /api/pedido — el comprador confirma el pedido
   ---------------------------------------------------------
   Esta ruta la llama el STOREFRONT PÚBLICO, sin sesión: el comprador es
   anónimo. Por eso no puede escribir con `getScoped` ni aceptar que el
   cliente mande precios: `crearPedido` llama a la RPC `shop_crear_pedido`,
   que vuelve a leer el precio de la base y descuenta stock.

   El `medio` decide qué pasa después:
     · "transferencia" → se devuelve el pedido y la tienda muestra el CBU.
     · "mercadopago"   → se crea la preferencia y se devuelve `initPoint`.
   ========================================================= */

export const dynamic = "force-dynamic";

interface Cuerpo {
  slug?: string;
  medio?: string;
  cliente?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  lineas?: LineaPedido[];
}

export async function POST(request: Request) {
  let cuerpo: Cuerpo;
  try {
    cuerpo = (await request.json()) as Cuerpo;
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo leer la petición." }, { status: 400 });
  }

  const slug = String(cuerpo.slug ?? "").trim();
  const cliente = String(cuerpo.cliente ?? "").trim();
  const telefono = String(cuerpo.telefono ?? "").trim();
  const direccion = String(cuerpo.direccion ?? "").trim();
  const medio = String(cuerpo.medio ?? "transferencia");
  const lineas = Array.isArray(cuerpo.lineas) ? cuerpo.lineas : [];

  if (!slug) {
    return NextResponse.json({ ok: false, error: "Falta la tienda." }, { status: 400 });
  }
  if (!cliente || !telefono || !direccion) {
    return NextResponse.json({ ok: false, error: "Faltan datos de contacto." }, { status: 400 });
  }
  if (lineas.length === 0) {
    return NextResponse.json({ ok: false, error: "El carrito está vacío." }, { status: 400 });
  }
  if (lineas.length > 100) {
    return NextResponse.json({ ok: false, error: "El pedido es demasiado grande." }, { status: 400 });
  }

  let pedido;
  try {
    pedido = await crearPedido({
      slug,
      cliente,
      telefono,
      email: String(cuerpo.email ?? "").trim(),
      direccion,
      lineas,
    });
  } catch (e) {
    console.error("[api/pedido]", e);
    return NextResponse.json(
      { ok: false, error: "No se pudo registrar el pedido. Intentalo otra vez." },
      { status: 500 }
    );
  }

  /* Correos: al comprador y al dueño. No bloquean la respuesta ni hacen
     fallar el pedido: si el SMTP no está, simplemente no se manda. */
  if (!MODO_DISENO) {
    void (async () => {
      try {
        const [tienda, cfg] = await Promise.all([
          obtenerTienda(slug),
          obtenerConfiguracionPublica(slug),
        ]);
        await enviarEmailsPedido({
          pedido,
          tienda: tienda?.nombre ?? "Tienda",
          transferencia: cfg.transferencia,
          whatsapp: cfg.whatsapp,
          emailDueno: cfg.email,
          esTransferencia: medio === "transferencia",
        });
      } catch (e) {
        console.error("[api/pedido] email", e);
      }
    })();
  }

  if (medio === "mercadopago" && !MODO_DISENO) {
    const token = await obtenerAccessTokenMercadopago(slug);
    if (!token) {
      return NextResponse.json(
        { ok: false, error: "La tienda no tiene MercadoPago configurado." },
        { status: 400 }
      );
    }
    try {
      /* La URL pública: detrás de Coolify, el origen interno no sirve para
         que MercadoPago pueda volver ni avisar. Se prefiere APP_URL. */
      const origin = (process.env.APP_URL || new URL(request.url).origin).replace(/\/+$/, "");
      const initPoint = await crearPreferencia(token, pedido, { origin, slug });
      return NextResponse.json({ ok: true, pedido, initPoint });
    } catch (e) {
      console.error("[api/pedido] mercadopago", e);
      return NextResponse.json(
        { ok: false, error: "No se pudo iniciar el pago con MercadoPago." },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({ ok: true, pedido });
}
