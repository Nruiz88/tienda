"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Minus, Plus, RotateCcw, ShoppingBag, Truck, MessageCircle } from "lucide-react";
import type { Producto } from "@/lib/shop/tipos";
import { aPesos } from "@/lib/dinero";
import { useCarrito } from "@/components/carrito/proveedor";
import { MediaProducto } from "@/components/tienda/media";
import { cn } from "@/lib/utils";

/* Ficha de producto. Es cliente porque el carrito vive en el navegador.
   El talle se elige con recuadros —no con un `select`— porque es la
   decisión principal de la pantalla y tiene que verse de un vistazo. */
export function Ficha({ producto, slug, whatsapp }: { producto: Producto; slug: string; whatsapp?: string }) {
  const { agregar } = useCarrito();
  const conStock = useMemo(() => producto.variantes.filter((v) => v.stock > 0), [producto]);
  const [varianteId, setVarianteId] = useState(conStock[0]?.id ?? producto.variantes[0]?.id ?? "");
  const [cantidad, setCantidad] = useState(1);
  const [agregado, setAgregado] = useState(false);
  const [indice, setIndice] = useState(0);

  const imagenes = producto.imagenes.length > 0 ? producto.imagenes : ["📦"];

  const variante = producto.variantes.find((v) => v.id === varianteId) ?? producto.variantes[0];
  const agotado = !variante || variante.stock <= 0;
  const varios = producto.variantes.length > 1;

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
      <div className="space-y-3">
        <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl border border-borde bg-panel-2">
          <MediaProducto
            valor={imagenes[indice]}
            alt={producto.nombre}
            className="text-[8rem] sm:text-[10rem]"
          />
          {agotado && (
            <span className="absolute top-4 left-4 rounded-full bg-panel px-3 py-1 text-[0.62rem] font-semibold tracking-[0.16em] text-mal uppercase">
              Agotado
            </span>
          )}
        </div>

        {imagenes.length > 1 && (
          <div className="flex gap-3">
            {imagenes.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndice(i)}
                aria-label={`Ver imagen ${i + 1}`}
                className={cn(
                  "flex size-20 items-center justify-center overflow-hidden rounded-lg border bg-hundido transicion",
                  i === indice ? "border-acento" : "border-borde opacity-70 hover:opacity-100"
                )}
              >
                <MediaProducto valor={src} className="text-3xl" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="lg:py-3">
        <span className="text-[0.7rem] font-medium tracking-[0.22em] text-apagado uppercase">
          {producto.categoria}
        </span>
        <h1 className="mt-3 font-display text-3xl leading-tight text-texto sm:text-4xl">
          {producto.nombre}
        </h1>
        <p className="mt-4 text-2xl font-semibold text-texto cifra">
          {aPesos(variante?.precioCentavos ?? 0)}
        </p>
        <p className="mt-5 max-w-prose text-sm leading-relaxed text-claro">{producto.descripcion}</p>

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <span className="text-[0.72rem] font-semibold tracking-[0.16em] text-texto uppercase">
              {varios ? "Talle" : "Presentación"}
            </span>
            {varios && (
              <span className="cursor-pointer text-xs text-apagado underline underline-offset-4">
                Guía de talles
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {producto.variantes.map((v) => {
              const sinStock = v.stock <= 0;
              const activa = v.id === varianteId;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={sinStock}
                  onClick={() => {
                    setVarianteId(v.id);
                    setCantidad(1);
                    setAgregado(false);
                  }}
                  className={cn(
                    "flex min-w-12 items-center justify-center rounded-md border px-3 py-2.5 text-sm transicion",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento",
                    activa
                      ? "border-acento bg-acento font-semibold text-acento-oscuro"
                      : "border-borde text-texto hover:border-borde-fuerte",
                    sinStock && "cursor-not-allowed border-dashed text-apagado line-through opacity-60"
                  )}
                >
                  {v.nombre}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <div className="flex h-12 items-center justify-between rounded-md border border-borde px-1.5 sm:w-32">
            <button
              type="button"
              aria-label="Quitar uno"
              className="flex size-9 items-center justify-center rounded text-apagado transicion hover:text-texto"
              onClick={() => setCantidad((c) => Math.max(1, c - 1))}
            >
              <Minus className="size-4" />
            </button>
            <span className="w-8 text-center text-sm font-semibold cifra">{cantidad}</span>
            <button
              type="button"
              aria-label="Agregar uno"
              className="flex size-9 items-center justify-center rounded text-apagado transicion hover:text-texto"
              onClick={() => setCantidad((c) => Math.min(variante?.stock ?? 1, c + 1))}
            >
              <Plus className="size-4" />
            </button>
          </div>

          <button
            type="button"
            disabled={agotado}
            onClick={() => {
              if (!variante) return;
              agregar({ id: producto.id, nombre: producto.nombre, imagen: producto.imagenes[0] }, variante, cantidad);
              setAgregado(true);
            }}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-md bg-acento px-6 text-xs font-semibold tracking-[0.18em] text-acento-oscuro uppercase transicion hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {agregado ? <Check className="size-4" aria-hidden /> : <ShoppingBag className="size-4" aria-hidden />}
            {agotado ? "Sin stock" : agregado ? "Agregado" : "Agregar al carrito"}
          </button>
        </div>

        <div className="mt-3 flex min-h-5 items-center gap-3 text-xs">
          {agregado && (
            <Link
              href={`/tienda/${slug}/carrito`}
              className="font-semibold text-texto underline underline-offset-4"
            >
              Ir al carrito
            </Link>
          )}
          {!agotado && variante.stock <= 5 && (
            <span className="text-aviso">Últimas {variante.stock} unidades</span>
          )}
        </div>

        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
              `Hola, me interesa ${producto.nombre}${variante ? ` (${variante.nombre})` : ""}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex h-12 items-center justify-center gap-2 rounded-md border border-borde text-xs font-semibold tracking-[0.16em] text-texto uppercase transicion hover:bg-panel"
          >
            <MessageCircle className="size-4 text-ok" aria-hidden />
            Consultar por WhatsApp
          </a>
        )}

        <ul className="mt-8 space-y-3.5 border-t border-borde pt-6 text-sm text-apagado">
          <li className="flex items-center gap-3">
            <Truck className="size-4 shrink-0 text-claro" aria-hidden />
            Envío en 24–48 h. Sin cargo desde $80.000.
          </li>
          <li className="flex items-center gap-3">
            <RotateCcw className="size-4 shrink-0 text-claro" aria-hidden />
            Cambios sin cargo dentro de los 30 días.
          </li>
        </ul>
      </div>
    </div>
  );
}
