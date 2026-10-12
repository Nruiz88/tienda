"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Producto } from "@/lib/shop/tipos";
import { aAncla } from "@/lib/shop/slug";
import { Tarjeta } from "@/components/tienda/tarjeta";
import { cn } from "@/lib/utils";

/* Catálogo con buscador y filtro por categoría. Filtra en el navegador
   sobre los productos que ya vinieron del servidor (el catálogo de una
   tienda chica entra de sobra en una respuesta). */
export function CatalogoProductos({
  slug,
  productos,
  categorias,
}: {
  slug: string;
  productos: Producto[];
  categorias: string[];
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Todas");

  const filtrados = useMemo(
    () =>
      productos.filter(
        (p) =>
          (cat === "Todas" || p.categoria === cat) &&
          `${p.nombre} ${p.categoria} ${p.descripcion}`.toLowerCase().includes(q.toLowerCase())
      ),
    [productos, q, cat]
  );

  const agrupado = useMemo(() => {
    const m = new Map<string, Producto[]>();
    for (const p of filtrados) {
      if (!m.has(p.categoria)) m.set(p.categoria, []);
      m.get(p.categoria)!.push(p);
    }
    return [...m.entries()];
  }, [filtrados]);

  const porCategoria = cat === "Todas" && !q.trim();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-apagado" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar prendas…"
            aria-label="Buscar"
            className="w-full rounded-full border border-borde bg-panel py-2.5 pl-9 pr-4 text-sm text-texto placeholder:text-apagado focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["Todas", ...categorias].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-[0.7rem] font-medium tracking-[0.12em] uppercase transicion",
                cat === c
                  ? "border-acento bg-acento text-acento-oscuro"
                  : "border-borde text-apagado hover:border-borde-fuerte hover:text-texto"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtrados.length === 0 ? (
        <p className="py-20 text-center text-sm text-apagado">No encontramos prendas con esos filtros.</p>
      ) : porCategoria ? (
        agrupado.map(([categoria, items]) => (
          <section key={categoria} id={aAncla(categoria)} className="scroll-mt-36 pt-6">
            <header className="mb-6 flex items-end justify-between gap-4 border-b border-borde pb-3">
              <h2 className="font-display text-2xl text-texto sm:text-3xl">{categoria}</h2>
              <span className="shrink-0 text-[0.7rem] tracking-[0.18em] text-apagado uppercase">
                {items.length} {items.length === 1 ? "prenda" : "prendas"}
              </span>
            </header>
            <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((p) => (
                <Tarjeta key={p.id} slug={slug} producto={p} />
              ))}
            </div>
          </section>
        ))
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-9 pt-2 sm:grid-cols-3 lg:grid-cols-4">
          {filtrados.map((p) => (
            <Tarjeta key={p.id} slug={slug} producto={p} />
          ))}
        </div>
      )}
    </div>
  );
}
