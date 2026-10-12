import type { Pedido } from "./tipos";

/* =========================================================
   MercadoPago
   ---------------------------------------------------------
   Checkout Pro: se crea una PREFERENCIA en MercadoPago y se manda al
   comprador a su pantalla de pago. Cuando paga, MercadoPago avisa por
   webhook y ahí se marca el pedido como pagado (ver
   `/api/webhooks/mercadopago`).

   El precio que se manda es el que ya quedó guardado en el pedido: el
   navegador nunca decide cuánto se cobra.
   ========================================================= */

const API = "https://api.mercadopago.com";

/** Crea la preferencia y devuelve la URL a la que mandar al comprador. */
export async function crearPreferencia(
  accessToken: string,
  pedido: Pedido,
  opts: { origin: string; slug: string }
): Promise<string> {
  const items = pedido.lineas.map((l) => ({
    title: `${l.nombre} (${l.variante})`,
    quantity: l.cantidad,
    unit_price: l.precioCentavos / 100,
    currency_id: "ARS",
  }));

  const cuerpo = {
    items,
    external_reference: pedido.id,
    /* El `?pedido=` es clave: el webhook no sabe de qué cliente es el pago
       hasta saber el pedido. Con el id, resuelve el token de ESE cliente. */
    notification_url: `${opts.origin}/api/webhooks/mercadopago?pedido=${pedido.id}`,
    back_urls: {
      success: `${opts.origin}/tienda/${opts.slug}/gracias?pedido=${pedido.id}`,
      pending: `${opts.origin}/tienda/${opts.slug}/gracias?pedido=${pedido.id}`,
      failure: `${opts.origin}/tienda/${opts.slug}/checkout`,
    },
    auto_return: "approved",
  };

  const r = await fetch(`${API}/checkout/preferences`, {
    method: "POST",
    headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  if (!r.ok) {
    throw new Error(`MercadoPago devolvió ${r.status}: ${await r.text().catch(() => "")}`);
  }
  const data = (await r.json()) as { init_point?: string; sandbox_init_point?: string };
  const url = data.init_point || data.sandbox_init_point;
  if (!url) throw new Error("MercadoPago no devolvió init_point");
  return url;
}

/** Consulta un pago por id. Devuelve el estado y la referencia externa. */
export async function consultarPago(
  accessToken: string,
  pagoId: string
): Promise<{ status: string; external_reference: string | null } | null> {
  const r = await fetch(`${API}/v1/payments/${pagoId}`, {
    headers: { Authorization: "Bearer " + accessToken },
  });
  if (!r.ok) return null;
  const data = (await r.json()) as { status?: string; external_reference?: string };
  return { status: data.status ?? "", external_reference: data.external_reference ?? null };
}
