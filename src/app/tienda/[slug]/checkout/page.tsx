import { CheckoutVista } from "@/components/tienda/checkout-vista";
import { obtenerConfiguracionPublica } from "@/lib/shop/configuracion";

export const dynamic = "force-dynamic";

export default async function PaginaCheckout({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = await obtenerConfiguracionPublica(slug);
  return <CheckoutVista slug={slug} config={config} />;
}
