import Link from "next/link";
import { ArrowUpRight, ClipboardList, Package, TrendingUp, TriangleAlert, type LucideIcon } from "lucide-react";
import { listarPedidos, listarProductosAdmin } from "@/lib/shop/catalogo";
import { sesionAdmin } from "@/lib/acceso/admin";
import { aPesos } from "@/lib/dinero";
import { tonoDeEstado } from "@/lib/shop/estado";
import { Badge } from "@/components/ui/badge";
import { MediaProducto } from "@/components/tienda/media";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TONO_BG = {
  acento: "bg-acento/10 text-acento",
  aviso: "bg-aviso/10 text-aviso",
  mal: "bg-mal/10 text-mal",
  ok: "bg-ok/10 text-ok",
} as const;

function Kpi({
  etiqueta,
  valor,
  detalle,
  icono: Icono,
  tono,
}: {
  etiqueta: string;
  valor: string;
  detalle: string;
  icono: LucideIcon;
  tono: keyof typeof TONO_BG;
}) {
  return (
    <div className="rounded-xl border border-borde bg-panel p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[0.7rem] font-semibold tracking-[0.14em] text-apagado uppercase">
          {etiqueta}
        </span>
        <span className={cn("flex size-9 items-center justify-center rounded-lg", TONO_BG[tono])}>
          <Icono className="size-4.5" aria-hidden />
        </span>
      </div>
      <div className="mt-4 text-2xl font-bold text-texto cifra">{valor}</div>
      <div className="mt-1 text-xs text-apagado">{detalle}</div>
    </div>
  );
}

function stockDe(variantes: { stock: number }[]) {
  return variantes.reduce((s, v) => s + v.stock, 0);
}

export default async function Resumen() {
  const sesion = await sesionAdmin();
  const [pedidos, productos] = await Promise.all([
    listarPedidos(sesion.clientId),
    listarProductosAdmin(sesion.clientId),
  ]);

  const vendido = pedidos.filter((p) => p.estado !== "cancelado").reduce((s, p) => s + p.totalCentavos, 0);
  const activos = productos.filter((p) => p.activo);
  const pendientes = pedidos.filter((p) => p.estado === "pendiente");
  const bajos = productos
    .filter((p) => p.activo)
    .map((p) => ({ ...p, stock: stockDe(p.variantes) }))
    .filter((p) => p.stock <= 5)
    .sort((a, b) => a.stock - b.stock);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-texto">Resumen</h1>
        <p className="mt-1 text-sm text-apagado">Todo lo de la tienda, de un vistazo.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          etiqueta="Vendido"
          valor={aPesos(vendido)}
          detalle={`${pedidos.filter((p) => p.estado !== "cancelado").length} pedidos con venta`}
          icono={TrendingUp}
          tono="acento"
        />
        <Kpi
          etiqueta="Pendientes"
          valor={String(pendientes.length)}
          detalle="por preparar"
          icono={ClipboardList}
          tono={pendientes.length ? "aviso" : "ok"}
        />
        <Kpi
          etiqueta="Productos"
          valor={String(activos.length)}
          detalle={`${productos.length} en total`}
          icono={Package}
          tono="acento"
        />
        <Kpi
          etiqueta="Stock bajo"
          valor={String(bajos.length)}
          detalle="para reponer"
          icono={TriangleAlert}
          tono={bajos.length ? "mal" : "ok"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="rounded-xl border border-borde bg-panel">
          <header className="flex items-center justify-between border-b border-borde px-5 py-4">
            <h2 className="text-sm font-semibold text-texto">Últimos pedidos</h2>
            <Link
              href="/pedidos"
              className="flex items-center gap-1 text-xs font-medium text-acento transicion hover:gap-1.5"
            >
              Ver todos
              <ArrowUpRight className="size-3.5" aria-hidden />
            </Link>
          </header>
          <ul className="divide-y divide-borde">
            {pedidos.slice(0, 5).map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="w-14 shrink-0 text-sm font-semibold text-apagado cifra">#{p.numero}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-texto">{p.cliente}</span>
                <span className="shrink-0 text-sm font-semibold text-texto cifra">
                  {aPesos(p.totalCentavos)}
                </span>
                <Badge tono={tonoDeEstado(p.estado)}>{p.estado}</Badge>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-borde bg-panel">
          <header className="flex items-center justify-between border-b border-borde px-5 py-4">
            <h2 className="text-sm font-semibold text-texto">Stock por reponer</h2>
            <Link
              href="/productos"
              className="flex items-center gap-1 text-xs font-medium text-acento transicion hover:gap-1.5"
            >
              Productos
              <ArrowUpRight className="size-3.5" aria-hidden />
            </Link>
          </header>
          {bajos.length === 0 ? (
            <p className="px-5 py-6 text-sm text-apagado">Nada por reponer. Todo con stock.</p>
          ) : (
            <ul className="divide-y divide-borde">
              {bajos.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-borde bg-hundido">
                    <MediaProducto valor={p.imagenes[0]} alt={p.nombre} className="text-lg" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-texto">{p.nombre}</span>
                  <Badge tono={p.stock === 0 ? "mal" : "aviso"}>
                    {p.stock === 0 ? "Agotado" : `${p.stock} u.`}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
