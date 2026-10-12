import { ProductosAdmin } from "@/components/admin/productos";
import { paginaProductos } from "@/lib/shop/catalogo";
import { sesionAdmin } from "@/lib/acceso/admin";

export const dynamic = "force-dynamic";

const POR_PAGINA = 20;

export default async function PaginaProductos({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const sesion = await sesionAdmin();

  const pagina = Math.max(1, Number(sp.pagina) || 1);
  const q = typeof sp.q === "string" ? sp.q : "";

  const { items, total } = await paginaProductos({
    clientId: sesion.clientId,
    q,
    pagina,
    porPagina: POR_PAGINA,
  });

  return (
    <ProductosAdmin
      key={`${pagina}-${q}`}
      iniciales={items}
      total={total}
      pagina={pagina}
      porPagina={POR_PAGINA}
      q={q}
    />
  );
}
