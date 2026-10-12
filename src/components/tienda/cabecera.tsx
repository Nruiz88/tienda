"use client";

import Link from "next/link";
import { Search, ShoppingBag } from "lucide-react";
import { useCarrito } from "@/components/carrito/proveedor";
import { aAncla } from "@/lib/shop/slug";

/* =========================================================
   Cabecera del storefront
   ---------------------------------------------------------
   Barra de anuncio (negra, fina) + cabecera fija con la marca centrada y
   el carrito a la derecha, como una tienda de ropa. Las categorías van
   debajo, centradas en escritorio y deslizándose en móvil.

   La marca va centrada con una rejilla de tres columnas —izquierda,
   centro, derecha— y no con `justify-between`: así queda en el centro
   REAL, que es lo que hace que una cabecera parezca una cabecera y no un
   menú.
   ========================================================= */

export function Cabecera({
  slug,
  nombre,
  logoUrl,
  categorias,
}: {
  slug: string;
  nombre: string;
  logoUrl?: string;
  categorias: string[];
}) {
  const { cantidadTotal } = useCarrito();
  const base = `/tienda/${slug}`;

  return (
    <>
      <div className="bg-texto px-4 py-2 text-center text-[0.68rem] font-medium tracking-[0.18em] text-panel uppercase">
        Envío sin cargo desde $80.000 · Cambios dentro de 30 días
      </div>

      <header className="sticky top-0 z-50 border-b border-borde bg-panel/90 backdrop-blur">
        <div className="mx-auto grid w-full max-w-[84rem] grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3.5 sm:px-6">
          <div className="justify-self-start">
            <button
              type="button"
              aria-label="Buscar"
              className="rounded-md p-2 text-texto transicion hover:bg-panel-2"
            >
              <Search className="size-4.5" aria-hidden />
            </button>
          </div>

          <Link href={base} className="justify-self-center" aria-label={nombre}>
            {logoUrl ? (
              <img src={logoUrl} alt={nombre} className="h-9 w-auto max-w-[12rem] object-contain" />
            ) : (
              <span className="font-display text-xl font-semibold tracking-[0.28em] text-texto uppercase">
                {nombre}
              </span>
            )}
          </Link>

          <div className="justify-self-end">
            <Link
              href={`${base}/carrito`}
              aria-label="Carrito"
              className="relative rounded-md p-2 text-texto transicion hover:bg-panel-2"
            >
              <ShoppingBag className="size-4.5" aria-hidden />
              {cantidadTotal > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex size-4.5 items-center justify-center rounded-full bg-acento text-[0.62rem] font-bold text-acento-oscuro">
                  {cantidadTotal}
                </span>
              )}
            </Link>
          </div>
        </div>

        <nav aria-label="Categorías" className="hidden border-t border-borde md:block">
          <ul className="mx-auto flex max-w-[84rem] items-center justify-center gap-8 px-6 py-3">
            {categorias.map((c) => (
              <li key={c}>
                <Link
                  href={`${base}#${aAncla(c)}`}
                  className="text-[0.72rem] font-medium tracking-[0.18em] text-apagado uppercase transicion hover:text-texto"
                >
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav
          aria-label="Categorías"
          className="-mx-px flex gap-5 overflow-x-auto border-t border-borde px-4 py-2.5 md:hidden"
        >
          {categorias.map((c) => (
            <Link
              key={c}
              href={`${base}#${aAncla(c)}`}
              className="shrink-0 text-[0.7rem] font-medium tracking-[0.16em] text-apagado uppercase"
            >
              {c}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}
