import type { ReactNode } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listarProductos, obtenerTienda } from "@/lib/shop/catalogo";
import { obtenerConfiguracionPublica } from "@/lib/shop/configuracion";
import { ordenarCategorias } from "@/lib/shop/slug";
import { ProveedorCarrito } from "@/components/carrito/proveedor";
import { Cabecera } from "@/components/tienda/cabecera";
import { Pie } from "@/components/tienda/pie";

export const dynamic = "force-dynamic";

/* Título, descripción y favicon por tienda (SEO básico). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tienda = await obtenerTienda(slug);
  if (!tienda) return { title: "Tienda" };
  return {
    title: { absolute: tienda.nombre },
    description: tienda.descripcion || undefined,
    icons: { icon: `/tienda/${slug}/icon` },
    openGraph: {
      title: tienda.nombre,
      description: tienda.descripcion || undefined,
      type: "website",
    },
  };
}

/* Layout de una tienda. Resuelve el slug, enciende el TEMA CLARO y carga
   la configuración pública (contacto/redes) para el pie. */
export default async function LayoutTienda({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [tienda, productos, config] = await Promise.all([
    obtenerTienda(slug),
    listarProductos(slug),
    obtenerConfiguracionPublica(slug),
  ]);
  if (!tienda) notFound();

  const categorias = ordenarCategorias([...new Set(productos.map((p) => p.categoria))]);

  return (
    <div className="tienda-tema flex min-h-dvh flex-col bg-fondo">
      <ProveedorCarrito>
        <Cabecera slug={slug} nombre={tienda.nombre} logoUrl={tienda.logoUrl} categorias={categorias} />
        <main className="mx-auto w-full max-w-[84rem] flex-1 px-4 sm:px-6">{children}</main>
        <Pie nombre={tienda.nombre} slug={slug} config={config} />
      </ProveedorCarrito>
    </div>
  );
}
