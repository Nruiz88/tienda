import { CarritoVista } from "@/components/tienda/carrito-vista";

export const dynamic = "force-dynamic";

export default async function PaginaCarrito({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CarritoVista slug={slug} />;
}
