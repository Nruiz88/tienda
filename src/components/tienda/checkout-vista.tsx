"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, CreditCard, Landmark, MessageCircle } from "lucide-react";
import { useCarrito } from "@/components/carrito/proveedor";
import { aPesos } from "@/lib/dinero";
import { cn } from "@/lib/utils";
import type { ConfiguracionPublica } from "@/lib/shop/configuracion";
import type { Pedido } from "@/lib/shop/tipos";

const CAMPO =
  "w-full rounded-md border border-borde bg-panel px-3.5 py-3 text-sm text-texto placeholder:text-apagado focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento";
const ETIQUETA = "mb-1.5 block text-[0.7rem] font-semibold tracking-[0.14em] text-apagado uppercase";

function waLink(numero: string, texto: string) {
  return `https://wa.me/${numero.replace(/\D/g, "")}?text=${encodeURIComponent(texto)}`;
}

export function CheckoutVista({ slug, config }: { slug: string; config: ConfiguracionPublica }) {
  const { lineas, totalCentavos, vaciar } = useCarrito();
  const base = `/tienda/${slug}`;

  const hayTransferencia = Boolean(config.transferencia.cbu || config.transferencia.alias);
  const metodos: ("mercadopago" | "transferencia" | "coordinar")[] = [];
  if (config.mercadopago) metodos.push("mercadopago");
  if (hayTransferencia) metodos.push("transferencia");
  if (metodos.length === 0) metodos.push("coordinar");

  const [medio, setMedio] = useState(metodos[0]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Pedido | null>(null);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const datos = new FormData(e.currentTarget);
    setEnviando(true);
    try {
      const r = await fetch("/api/pedido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          medio,
          cliente: datos.get("cliente"),
          telefono: datos.get("telefono"),
          email: datos.get("email"),
          direccion: datos.get("direccion"),
          lineas,
        }),
      });
      const json = await r.json();
      if (!r.ok || !json.ok) throw new Error(json.error || "No se pudo crear el pedido.");
      if (json.initPoint) {
        window.location.href = json.initPoint;
        return;
      }
      vaciar();
      setResultado(json.pedido as Pedido);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el pedido.");
      setEnviando(false);
    }
  }

  /* ── Confirmación ── */
  if (resultado) {
    const total = aPesos(resultado.totalCentavos);
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-ok/40 bg-ok/10">
          <CheckCircle2 className="size-7 text-ok" aria-hidden />
        </div>
        <h1 className="mt-6 font-display text-3xl text-texto">
          Pedido #{resultado.numero} registrado
        </h1>
        <p className="mt-2 text-sm text-apagado">Total {total}.</p>

        {medio === "transferencia" && hayTransferencia ? (
          <div className="mt-7 rounded-xl border border-borde bg-panel p-5 text-left">
            <p className="text-sm font-semibold text-texto">Transferí el total a:</p>
            <dl className="mt-3 space-y-2 text-sm">
              {config.transferencia.alias && (
                <div className="flex justify-between gap-3">
                  <dt className="text-apagado">Alias</dt>
                  <dd className="font-semibold text-texto">{config.transferencia.alias}</dd>
                </div>
              )}
              {config.transferencia.cbu && (
                <div className="flex justify-between gap-3">
                  <dt className="text-apagado">CBU</dt>
                  <dd className="font-medium text-texto cifra">{config.transferencia.cbu}</dd>
                </div>
              )}
              {config.transferencia.titular && (
                <div className="flex justify-between gap-3">
                  <dt className="text-apagado">Titular</dt>
                  <dd className="text-texto">{config.transferencia.titular}</dd>
                </div>
              )}
              {config.transferencia.banco && (
                <div className="flex justify-between gap-3">
                  <dt className="text-apagado">Banco</dt>
                  <dd className="text-texto">{config.transferencia.banco}</dd>
                </div>
              )}
            </dl>
            {config.whatsapp && (
              <a
                href={waLink(config.whatsapp, `Hola, transferí el pedido #${resultado.numero} (${total}). Adjunto el comprobante.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex h-12 items-center justify-center gap-2 rounded-md bg-acento text-xs font-semibold tracking-[0.16em] text-acento-oscuro uppercase transicion hover:opacity-90"
              >
                <MessageCircle className="size-4" aria-hidden />
                Enviar comprobante por WhatsApp
              </a>
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm text-apagado">
            Te vamos a contactar para coordinar el pago y la entrega.
          </p>
        )}

        <Link href={base} className="mt-6 inline-block text-sm text-apagado underline underline-offset-4">
          Seguir comprando
        </Link>
      </div>
    );
  }

  if (lineas.length === 0) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <h1 className="font-display text-2xl text-texto">No hay nada para confirmar</h1>
        <Link href={base} className="mt-4 inline-block text-sm text-apagado underline underline-offset-4">
          Volver a la colección
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="pt-8 pb-12">
      <header className="mb-6 border-b border-borde pb-4">
        <h1 className="font-display text-3xl text-texto">Checkout</h1>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
        <section className="space-y-8">
          <div>
            <h2 className="mb-4 text-[0.72rem] font-semibold tracking-[0.16em] text-texto uppercase">
              Datos de contacto
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="cliente" className={ETIQUETA}>
                  Nombre y apellido
                </label>
                <input id="cliente" name="cliente" required autoComplete="name" className={CAMPO} />
              </div>
              <div>
                <label htmlFor="telefono" className={ETIQUETA}>
                  Teléfono
                </label>
                <input id="telefono" name="telefono" type="tel" required autoComplete="tel" className={CAMPO} />
              </div>
              <div>
                <label htmlFor="email" className={ETIQUETA}>
                  Email <span className="font-normal normal-case">(opcional)</span>
                </label>
                <input id="email" name="email" type="email" autoComplete="email" className={CAMPO} />
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-[0.72rem] font-semibold tracking-[0.16em] text-texto uppercase">Entrega</h2>
            <label htmlFor="direccion" className={ETIQUETA}>
              Dirección
            </label>
            <input id="direccion" name="direccion" required autoComplete="street-address" className={CAMPO} />
          </div>

          <div>
            <h2 className="mb-3 text-[0.72rem] font-semibold tracking-[0.16em] text-texto uppercase">
              Forma de pago
            </h2>
            <div className="space-y-2">
              {metodos.map((m) => {
                const activo = medio === m;
                const etiqueta =
                  m === "mercadopago" ? "MercadoPago" : m === "transferencia" ? "Transferencia bancaria" : "A coordinar";
                const detalle =
                  m === "mercadopago"
                    ? "Tarjeta, débito, o efectivo en Rapipago / Pago Fácil."
                    : m === "transferencia"
                      ? "Te pasamos el CBU / Alias y enviás el comprobante."
                      : "Te contactamos para arreglar el pago.";
                const Icono = m === "mercadopago" ? CreditCard : Landmark;
                return (
                  <label
                    key={m}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transicion",
                      activo ? "border-acento bg-panel-2" : "border-borde hover:bg-panel-2"
                    )}
                  >
                    <input
                      type="radio"
                      name="medio"
                      value={m}
                      checked={activo}
                      onChange={() => setMedio(m)}
                      className="mt-0.5 size-4 accent-[var(--color-acento)]"
                    />
                    <span className="flex-1">
                      <span className="flex items-center gap-2 text-sm font-semibold text-texto">
                        <Icono className="size-4 text-acento" aria-hidden />
                        {etiqueta}
                      </span>
                      <span className="mt-0.5 block text-xs text-apagado">{detalle}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="rounded-md border border-mal/40 bg-mal/10 px-4 py-3 text-sm text-mal">{error}</p>
          )}
        </section>

        <aside className="h-fit rounded-xl border border-borde bg-panel p-6 lg:sticky lg:top-44">
          <h2 className="font-display text-xl text-texto">Tu pedido</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {lineas.map((l) => (
              <li key={l.varianteId} className="flex items-start justify-between gap-3">
                <span className="text-apagado">
                  {l.cantidad}× {l.nombre} <span className="text-apagado/80">· {l.variante}</span>
                </span>
                <span className="shrink-0 font-medium text-texto cifra">
                  {aPesos(l.precioCentavos * l.cantidad)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-baseline justify-between border-t border-borde pt-4">
            <span className="text-[0.72rem] font-semibold tracking-[0.16em] text-texto uppercase">Total</span>
            <span className="text-lg font-bold text-texto cifra">{aPesos(totalCentavos)}</span>
          </div>
          <button
            type="submit"
            disabled={enviando}
            className={cn(
              "mt-6 w-full rounded-md bg-acento py-3.5 text-xs font-semibold tracking-[0.18em] text-acento-oscuro uppercase transicion hover:opacity-90",
              enviando && "cursor-wait opacity-60"
            )}
          >
            {enviando ? "Confirmando…" : medio === "mercadopago" ? "Pagar con MercadoPago" : "Confirmar pedido"}
          </button>
        </aside>
      </div>
    </form>
  );
}
