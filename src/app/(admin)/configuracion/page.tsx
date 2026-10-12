import { ConfiguracionForm } from "@/components/admin/configuracion-form";
import { sesionAdmin } from "@/lib/acceso/admin";
import { obtenerConfiguracion } from "@/lib/shop/configuracion";
import { obtenerTiendaDelCliente } from "@/lib/shop/catalogo";

export const dynamic = "force-dynamic";

export default async function PaginaConfiguracion() {
  const sesion = await sesionAdmin();
  const [config, tienda] = await Promise.all([
    obtenerConfiguracion(sesion.clientId),
    obtenerTiendaDelCliente(sesion.clientId),
  ]);

  return (
    <ConfiguracionForm
      inicial={config}
      marcaInicial={{ logoUrl: tienda?.logoUrl ?? "", bannerUrl: tienda?.bannerUrl ?? "" }}
    />
  );
}
