import { NextResponse } from "next/server";
import { MODO_DISENO } from "@/lib/modo";
import { consultarPago } from "@/lib/shop/pagos";

/* =========================================================
   Webhook de MercadoPago
   ---------------------------------------------------------
   MercadoPago avisa acá cuando cambia el estado de un pago. El flujo:

     1. Llega `?pedido=<id>` + el id del pago en el cuerpo/query.
     2. Se busca el pedido → su `client_id` → el access token de ESE
        cliente.
     3. Se CONSULTA el pago en la API de MercadoPago con ese token (no se
        cree lo que diga el aviso: el aviso puede ser falsificado).
     4. Si está aprobado y la referencia externa coincide, se marca el
        pedido como pagado.

   ⚠️  SIEMPRE 200. MercadoPago reintenta si no recibe 200, y un error acá
   no debe hacerle reintentar para siempre. Los fallos reales se miran en
   el log.
   ========================================================= */

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (MODO_DISENO) return NextResponse.json({ ok: true });

  const url = new URL(request.url);
  const pedidoId = url.searchParams.get("pedido");

  let cuerpo: { data?: { id?: string | number }; type?: string } | null = null;
  try {
    cuerpo = await request.json();
  } catch {
    /* Algunos avisos vienen sin cuerpo. */
  }
  const pagoId = String(
    cuerpo?.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? ""
  );

  if (!pedidoId || !pagoId) return NextResponse.json({ ok: true });

  try {
    const { getAdmin } = await import("@/lib/db");
    const admin = getAdmin();

    const { data: pedido } = await admin
      .from("shop_pedidos")
      .select("id, client_id, estado")
      .eq("id", pedidoId)
      .maybeSingle();
    if (!pedido) return NextResponse.json({ ok: true });

    const { data: cfg } = await admin
      .from("shop_configuracion")
      .select("mercadopago_access_token")
      .eq("client_id", pedido.client_id)
      .maybeSingle();
    const token = cfg?.mercadopago_access_token;
    if (!token) return NextResponse.json({ ok: true });

    const pago = await consultarPago(token, pagoId);
    if (!pago) return NextResponse.json({ ok: true });

    if (pago.status === "approved" && pago.external_reference === pedidoId && pedido.estado === "pendiente") {
      await admin.from("shop_pedidos").update({ estado: "pagado" }).eq("id", pedidoId);
    }
  } catch (e) {
    console.error("[webhook/mercadopago]", e);
  }

  return NextResponse.json({ ok: true });
}
