import { PedidosAdmin } from "@/components/admin/pedidos";
import { paginaPedidos } from "@/lib/shop/catalogo";
import { sesionAdmin } from "@/lib/acceso/admin";
import type { EstadoPedido } from "@/lib/shop/tipos";

export const dynamic = "force-dynamic";

const POR_PAGINA = 20;
const ESTADOS_VALIDOS = ["pendiente", "pagado", "enviado", "entregado", "cancelado"];

export default async function PaginaPedidos({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const sesion = await sesionAdmin();

  const pagina = Math.max(1, Number(sp.pagina) || 1);
  const q = typeof sp.q === "string" ? sp.q : "";
  const crudo = typeof sp.estado === "string" ? sp.estado : "todos";
  const estado = (ESTADOS_VALIDOS.includes(crudo) ? crudo : "todos") as EstadoPedido | "todos";

  const { items, total } = await paginaPedidos({
    clientId: sesion.clientId,
    q,
    estado,
    pagina,
    porPagina: POR_PAGINA,
  });

  return (
    <PedidosAdmin
      key={`${pagina}-${estado}-${q}`}
      iniciales={items}
      total={total}
      pagina={pagina}
      porPagina={POR_PAGINA}
      q={q}
      estado={estado}
    />
  );
}
