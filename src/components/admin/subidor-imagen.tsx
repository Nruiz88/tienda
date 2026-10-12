"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { MediaProducto } from "@/components/tienda/media";
import { MODO_DISENO } from "@/lib/modo";
import { cn } from "@/lib/utils";
import { accionSubirImagen } from "@/app/(admin)/acciones";

/* =========================================================
   Subidor de imagen
   ---------------------------------------------------------
   Dos formas de poner una imagen: SUBIR un archivo o PEGAR una URL (o un
   emoji, para el relleno de demo). La vista previa aparece al instante.

   En modo diseño, subir muestra la imagen elegida con un `objectURL`
   local (no se sube nada); al conectar la base, el mismo botón la sube de
   verdad a Supabase Storage.
   ========================================================= */

export function SubidorImagen({
  valor,
  onChange,
  etiqueta,
  carpeta = "catalogo",
  aspecto = "cuadrado",
}: {
  valor: string;
  onChange: (v: string) => void;
  etiqueta: string;
  carpeta?: string;
  aspecto?: "cuadrado" | "ancho";
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);

  async function subir(file: File) {
    onChange(URL.createObjectURL(file)); // vista previa inmediata
    if (MODO_DISENO) return; // en modo diseño no se sube nada
    setSubiendo(true);
    try {
      const fd = new FormData();
      fd.set("archivo", file);
      fd.set("carpeta", carpeta);
      const r = await accionSubirImagen(fd);
      if (r.ok) onChange(r.url);
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-[0.7rem] font-semibold tracking-[0.14em] text-apagado uppercase">
        {etiqueta}
      </span>
      <div
        className={cn(
          "relative overflow-hidden rounded-lg border border-borde bg-hundido",
          aspecto === "ancho" ? "aspect-[16/6]" : "aspect-square"
        )}
      >
        <MediaProducto valor={valor} className="text-4xl" />
        {valor && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Quitar imagen"
            className="absolute top-1.5 right-1.5 rounded-md bg-panel/80 p-1 text-apagado transicion hover:text-mal"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-borde px-2.5 py-1.5 text-xs font-medium text-claro transicion hover:bg-panel-2 hover:text-texto"
        >
          <ImagePlus className="size-3.5" aria-hidden />
          {subiendo ? "Subiendo…" : "Subir"}
        </button>
        <input
          ref={ref}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) subir(f);
            e.target.value = "";
          }}
        />
        <input
          value={valor.startsWith("blob:") ? "" : valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder="…o pegá una URL"
          className="min-w-0 flex-1 rounded-md border border-borde bg-hundido px-2.5 py-1.5 text-xs text-texto placeholder:text-apagado focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento"
        />
      </div>
    </div>
  );
}
