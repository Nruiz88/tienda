import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerTienda, listarProductos } from "@/lib/shop/catalogo";
import { aAncla, ordenarCategorias } from "@/lib/shop/slug";
import { Tarjeta } from "@/components/tienda/tarjeta";
import { MediaProducto } from "@/components/tienda/media";
import { CatalogoProductos } from "@/components/tienda/catalogo-productos";

export const dynamic = "force-dynamic";

/* Catálogo público. Abierto a propósito: lo ve quien va a comprar, que no
   tiene cuenta. En el proxy está en `PUBLICAS`. */
export default async function Catalogo({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [tienda, productos] = await Promise.all([obtenerTienda(slug), listarProductos(slug)]);
  if (!tienda) notFound();

  const categorias = ordenarCategorias([...new Set(productos.map((p) => p.categoria))]);
  const destacados = productos.filter((p) => p.variantes.some((v) => v.stock > 0)).slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="relative -mx-4 border-b border-borde bg-panel-2 px-4 py-14 sm:-mx-6 sm:px-6 md:py-20">
        <div className="mx-auto grid w-full max-w-[84rem] gap-10 md:grid-cols-2 md:items-center">
          <div>
            <span className="text-[0.72rem] font-medium tracking-[0.24em] text-apagado uppercase">
              Nueva temporada
            </span>
            <h1 className="mt-4 font-display text-4xl leading-[1.05] text-texto sm:text-5xl md:text-6xl">
              Lo simple,
              <br />
              vestido bien.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-apagado">{tienda.descripcion}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`#${aAncla(categorias[0] ?? "productos")}`}
                className="rounded-md bg-acento px-6 py-3 text-xs font-semibold tracking-[0.16em] text-acento-oscuro uppercase transicion hover:opacity-90"
              >
                Ver colección
              </Link>
              <Link
                href={`#${aAncla("Accesorios")}`}
                className="rounded-md border border-borde-fuerte px-6 py-3 text-xs font-semibold tracking-[0.16em] text-texto uppercase transicion hover:bg-panel"
              >
                Accesorios
              </Link>
            </div>
          </div>

          {tienda.bannerUrl ? (
            <div className="overflow-hidden rounded-xl border border-borde">
              <img
                src={tienda.bannerUrl}
                alt={`${tienda.nombre} — nueva temporada`}
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {destacados.map((p) => (
                <Link
                  key={p.id}
                  href={`/tienda/${slug}/p/${p.slug}`}
                  className="group flex aspect-[4/5] items-center justify-center overflow-hidden rounded-lg border border-borde bg-panel"
                >
                  <MediaProducto
                    valor={p.imagenes[0]}
                    alt={p.nombre}
                    className="text-5xl transition-transform duration-500 group-hover:scale-110 sm:text-6xl"
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Catálogo con buscador y filtros */}
      <div className="pt-12 pb-4">
        <CatalogoProductos slug={slug} productos={productos} categorias={categorias} />
      </div>
    </div>
  );
}
