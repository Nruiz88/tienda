"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCarrito } from "@/components/carrito/proveedor";
import { aPesos } from "@/lib/dinero";

export function CarritoVista({ slug }: { slug: string }) {
  const { lineas, totalCentavos, cambiarCantidad, quitar } = useCarrito();
  const base = `/tienda/${slug}`;
  const unidades = lineas.reduce((s, l) => s + l.cantidad, 0);

  if (lineas.length === 0) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-borde bg-panel">
          <ShoppingBag className="size-6 text-apagado" aria-hidden />
        </div>
        <h1 className="mt-6 font-display text-2xl text-texto">Tu carrito está vacío</h1>
        <p className="mt-2 text-sm text-apagado">
          Todavía no elegiste ninguna prenda. La colección te espera.
        </p>
        <Link
          href={base}
          className="mt-8 inline-block rounded-md bg-acento px-6 py-3 text-xs font-semibold tracking-[0.16em] text-acento-oscuro uppercase transicion hover:opacity-90"
        >
          Ver la colección
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-8 pb-12">
      <header className="mb-6 flex items-baseline justify-between border-b border-borde pb-4">
        <h1 className="font-display text-3xl text-texto">Carrito</h1>
        <span className="text-[0.7rem] tracking-[0.18em] text-apagado uppercase">
          {unidades} {unidades === 1 ? "artículo" : "artículos"}
        </span>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
        <ul className="divide-y divide-borde">
          {lineas.map((l) => (
            <li key={l.varianteId} className="flex gap-4 py-5">
              <div className="flex size-20 shrink-0 items-center justify-center rounded-lg border border-borde bg-hundido text-3xl sm:size-24">
                {l.imagen ?? "📦"}
              </div>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-medium text-texto">{l.nombre}</h2>
                    <p className="mt-0.5 text-xs text-apagado">Talle {l.variante}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-texto cifra">
                    {aPesos(l.precioCentavos * l.cantidad)}
                  </span>
                </div>

                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center rounded-md border border-borde">
                    <button
                      type="button"
                      aria-label="Quitar uno"
                      className="flex size-8 items-center justify-center text-apagado transicion hover:text-texto"
                      onClick={() => cambiarCantidad(l.varianteId, l.cantidad - 1)}
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold cifra">{l.cantidad}</span>
                    <button
                      type="button"
                      aria-label="Agregar uno"
                      className="flex size-8 items-center justify-center text-apagado transicion hover:text-texto"
                      onClick={() => cambiarCantidad(l.varianteId, l.cantidad + 1)}
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    aria-label={`Quitar ${l.nombre}`}
                    className="flex items-center gap-1.5 text-xs text-apagado transicion hover:text-mal"
                    onClick={() => quitar(l.varianteId)}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    Quitar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-xl border border-borde bg-panel p-6 lg:sticky lg:top-44">
          <h2 className="font-display text-xl text-texto">Resumen</h2>
          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-apagado">Subtotal</dt>
              <dd className="font-semibold text-texto cifra">{aPesos(totalCentavos)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-apagado">Envío</dt>
              <dd className="text-claro">A coordinar</dd>
            </div>
          </dl>
          <div className="mt-4 flex items-baseline justify-between border-t border-borde pt-4">
            <span className="text-[0.72rem] font-semibold tracking-[0.16em] text-texto uppercase">Total</span>
            <span className="text-lg font-bold text-texto cifra">{aPesos(totalCentavos)}</span>
          </div>
          <Link
            href={`${base}/checkout`}
            className="mt-6 block w-full rounded-md bg-acento py-3.5 text-center text-xs font-semibold tracking-[0.18em] text-acento-oscuro uppercase transicion hover:opacity-90"
          >
            Continuar al checkout
          </Link>
          <Link href={base} className="mt-3 block text-center text-xs text-apagado underline underline-offset-4">
            Seguir comprando
          </Link>
        </aside>
      </div>
    </div>
  );
}
