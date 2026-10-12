"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { slugificar } from "@/lib/shop/slug";
import { accionCrearMiTienda } from "@/app/(admin)/alta/actions";

/* Pantalla de alta de tienda. Se muestra cuando el cliente ya tiene la
   sesión (entró desde el panel) pero todavía no tiene tienda. */

const CAMPO =
  "w-full rounded-lg border border-borde bg-hundido px-3.5 py-2.5 text-sm text-texto placeholder:text-apagado focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento";
const ETIQUETA = "mb-1.5 block text-[0.7rem] font-semibold tracking-[0.14em] text-apagado uppercase";

export function AltaTienda() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTocado, setSlugTocado] = useState(false);
  const [descripcion, setDescripcion] = useState("");
  const [conEjemplo, setConEjemplo] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slugFinal = slugTocado ? slugificar(slug) : slugificar(nombre);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    const r = await accionCrearMiTienda({ nombre, slug: slugFinal, descripcion, conEjemplo });
    if ("error" in r) {
      setError(r.error ?? "No se pudo crear la tienda.");
      setEnviando(false);
      return;
    }
    /* `refresh` vuelve a pedir el layout, que ya encuentra la tienda y
       pinta el admin normal. */
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-borde bg-panel p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-acento text-acento-oscuro">
            <Store className="size-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-lg font-bold text-texto">Creá tu tienda</h1>
            <p className="text-xs text-apagado">Un paso y queda lista para vender.</p>
          </div>
        </div>

        <form onSubmit={crear} className="mt-6 space-y-4">
          <div>
            <label htmlFor="nombre" className={ETIQUETA}>
              Nombre de la tienda
            </label>
            <input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              autoFocus
              className={CAMPO}
              placeholder="Nordés"
            />
          </div>

          <div>
            <label htmlFor="slug" className={ETIQUETA}>
              Dirección
            </label>
            <div className="flex items-center rounded-lg border border-borde bg-hundido pl-3 focus-within:ring-2 focus-within:ring-acento">
              <span className="text-sm text-apagado">/tienda/</span>
              <input
                id="slug"
                value={slugTocado ? slug : slugFinal}
                onChange={(e) => {
                  setSlugTocado(true);
                  setSlug(e.target.value);
                }}
                className="w-full bg-transparent px-1 py-2.5 text-sm text-texto placeholder:text-apagado focus:outline-none"
                placeholder="nordes"
              />
            </div>
            <p className="mt-1.5 text-xs text-apagado">
              Tu dirección pública será <span className="text-claro">/tienda/{slugFinal || "…"}</span>
            </p>
          </div>

          <div>
            <label htmlFor="descripcion" className={ETIQUETA}>
              Descripción (opcional)
            </label>
            <textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className={CAMPO}
              placeholder="Qué vendés, en una línea."
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-borde bg-hundido px-3 py-2.5 text-sm text-claro">
            <input
              type="checkbox"
              checked={conEjemplo}
              onChange={(e) => setConEjemplo(e.target.checked)}
              className="size-4 accent-[var(--color-acento)]"
            />
            Cargar productos de ejemplo (los podés borrar)
          </label>

          {error && (
            <p className="rounded-md border border-mal/40 bg-mal/10 px-3 py-2 text-sm text-mal">{error}</p>
          )}

          <Button type="submit" disabled={enviando} className="w-full">
            {enviando ? "Creando…" : "Crear tienda"}
            {!enviando && <ArrowRight className="size-4" aria-hidden />}
          </Button>
        </form>
      </div>
    </main>
  );
}
