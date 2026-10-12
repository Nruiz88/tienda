import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { obtenerTienda } from "@/lib/shop/catalogo";

export const dynamic = "force-dynamic";

/* Página de regreso de MercadoPago ("volviste del pago"). No confirma nada
   por sí sola: el pedido se marca pagado por el webhook, no por esta
   pantalla (cualquiera puede abrir esta URL). */
export default async function Gracias({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ pedido?: string; status?: string }>;
}) {
  const { slug } = await params;
  const { pedido } = await searchParams;
  const tienda = await obtenerTienda(slug);

  return (
    <div className="mx-auto max-w-lg py-24 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-ok/40 bg-ok/10">
        <CheckCircle2 className="size-7 text-ok" aria-hidden />
      </div>
      <h1 className="mt-6 font-display text-3xl text-texto">¡Gracias por tu compra!</h1>
      {pedido && (
        <p className="mt-2 text-sm text-apagado">
          Tu pedido <span className="font-semibold text-texto">#{pedido}</span> está en proceso.
        </p>
      )}
      <p className="mt-1 text-sm text-apagado">
        Cuando el pago se acredite, lo preparamos y te avisamos.
      </p>
      <Link
        href={`/tienda/${slug}`}
        className="mt-8 inline-block rounded-md bg-acento px-6 py-3 text-xs font-semibold tracking-[0.16em] text-acento-oscuro uppercase transicion hover:opacity-90"
      >
        Seguir comprando
      </Link>
      {tienda && <span className="sr-only">{tienda.nombre}</span>}
    </div>
  );
}
