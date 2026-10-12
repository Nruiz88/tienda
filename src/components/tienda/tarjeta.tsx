import Link from "next/link";
import type { Producto } from "@/lib/shop/tipos";
import { aPesos } from "@/lib/dinero";
import { esImagenUrl } from "@/lib/shop/imagenes";
import { MediaProducto } from "./media";

/* Tarjeta de producto: retrato 3:4, la prenda como protagonista y el
   precio abajo. Si hay una segunda FOTO, se muestra al pasar el ratón:
   es lo que hacen las tiendas de ropa para enseñar la prenda puesta. */
export function Tarjeta({ slug, producto }: { slug: string; producto: Producto }) {
  const precios = producto.variantes.map((v) => v.precioCentavos);
  const desde = Math.min(...precios);
  const hayStock = producto.variantes.some((v) => v.stock > 0);
  const varios = producto.variantes.length > 1;

  const principal = producto.imagenes[0];
  const segunda = producto.imagenes[1];
  const haySegunda = esImagenUrl(segunda);

  return (
    <Link href={`/tienda/${slug}/p/${producto.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-borde bg-hundido">
        <span className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-110">
          <MediaProducto valor={principal} alt={producto.nombre} className="text-6xl sm:text-7xl" />
        </span>
        {haySegunda && (
          <span className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            <MediaProducto valor={segunda} alt={producto.nombre} />
          </span>
        )}

        {!hayStock && (
          <span className="absolute top-3 left-3 rounded-full bg-panel px-2.5 py-1 text-[0.6rem] font-semibold tracking-[0.14em] text-mal uppercase">
            Agotado
          </span>
        )}
        {hayStock && varios && (
          <span className="absolute top-3 left-3 rounded-full bg-panel/85 px-2.5 py-1 text-[0.6rem] font-medium tracking-[0.14em] text-claro uppercase backdrop-blur">
            {producto.variantes.length} talles
          </span>
        )}

        <span className="absolute inset-x-0 bottom-0 translate-y-full bg-acento py-2.5 text-center text-[0.66rem] font-semibold tracking-[0.2em] text-acento-oscuro uppercase transition-transform duration-300 ease-out group-hover:translate-y-0">
          Ver producto
        </span>
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium text-texto">{producto.nombre}</h3>
        <span className="shrink-0 text-sm font-semibold text-texto cifra">
          {varios ? "desde " : ""}
          {aPesos(desde)}
        </span>
      </div>
    </Link>
  );
}
