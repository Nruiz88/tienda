import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { obtenerProducto, obtenerTienda } from "@/lib/shop/catalogo";
import { obtenerConfiguracionPublica } from "@/lib/shop/configuracion";
import { Ficha } from "@/components/tienda/ficha";

export const dynamic = "force-dynamic";

export default async function PaginaProducto({
  params,
}: {
  params: Promise<{ slug: string; producto: string }>;
}) {
  const { slug, producto: productoSlug } = await params;
  const [tienda, producto, config] = await Promise.all([
    obtenerTienda(slug),
    obtenerProducto(slug, productoSlug),
    obtenerConfiguracionPublica(slug),
  ]);
  if (!tienda || !producto) notFound();

  return (
    <div className="pt-6 pb-10">
      <nav className="mb-6 flex items-center gap-2 text-[0.7rem] tracking-[0.14em] text-apagado uppercase">
        <Link href={`/tienda/${slug}`} className="transicion hover:text-texto">
          Inicio
        </Link>
        <span className="text-borde-fuerte">/</span>
        <Link href={`/tienda/${slug}`} className="transicion hover:text-texto">
          {producto.categoria}
        </Link>
        <span className="text-borde-fuerte">/</span>
        <span className="text-claro">{producto.nombre}</span>
      </nav>

      <Ficha producto={producto} slug={slug} whatsapp={config.whatsapp} />

      <div className="mt-10">
        <Link
          href={`/tienda/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-texto transicion hover:gap-2.5"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Seguir viendo la colección
        </Link>
      </div>
    </div>
  );
}
