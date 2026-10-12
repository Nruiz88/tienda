"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { ESTADOS, type EstadoPedido, type Pedido } from "@/lib/shop/tipos";
import { aPesos } from "@/lib/dinero";
import { tonoDeEstado } from "@/lib/shop/estado";
import { Badge } from "@/components/ui/badge";
import { useAvisos } from "@/components/ui/toast";
import { accionCambiarEstadoPedido } from "@/app/(admin)/pedidos/actions";
import { cn } from "@/lib/utils";

/* Pedidos (admin). La búsqueda, el filtro por estado y la paginación van
   en el SERVIDOR: se pide una página y su total. Los cambios de estado
   se ven al instante (local) y se guardan con una Server Action. */

const fecha = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const SIGUIENTE: Record<EstadoPedido, { estado: EstadoPedido; texto: string } | null> = {
  pendiente: { estado: "pagado", texto: "Marcar como pagado" },
  pagado: { estado: "enviado", texto: "Marcar como enviado" },
  enviado: { estado: "entregado", texto: "Marcar como entregado" },
  entregado: null,
  cancelado: null,
};

export function PedidosAdmin({
  iniciales,
  total,
  pagina,
  porPagina,
  q,
  estado,
}: {
  iniciales: Pedido[];
  total: number;
  pagina: number;
  porPagina: number;
  q: string;
  estado: EstadoPedido | "todos";
}) {
  const avisar = useAvisos();
  const [pedidos, setPedidos] = useState<Pedido[]>(iniciales);
  const [abierto, setAbierto] = useState<string | null>(null);
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));

  function href(n: number, est: EstadoPedido | "todos") {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (est !== "todos") p.set("estado", est);
    if (n > 1) p.set("pagina", String(n));
    const s = p.toString();
    return "/pedidos" + (s ? "?" + s : "");
  }

  function cambiarEstado(id: string, nuevo: EstadoPedido, aviso?: string) {
    setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, estado: nuevo } : p)));
    if (aviso) avisar(aviso);
    void accionCambiarEstadoPedido(id, nuevo).then((r) => {
      if ("error" in r) avisar("No se guardó en la base: " + r.error);
    });
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-texto">Pedidos</h1>
        <p className="mt-1 text-sm text-apagado">{total} en total</p>
      </header>

      <form method="get" action="/pedidos" className="flex flex-wrap items-center gap-3">
        {estado !== "todos" && <input type="hidden" name="estado" value={estado} />}
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-apagado" aria-hidden />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por Nº o cliente…"
            aria-label="Buscar pedidos"
            className="w-full rounded-lg border border-borde bg-hundido py-2.5 pl-9 pr-3 text-sm text-texto placeholder:text-apagado focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento"
          />
        </div>
      </form>

      <div className="flex flex-wrap gap-1.5">
        {(["todos", ...ESTADOS] as const).map((f) => (
          <Link
            key={f}
            href={href(1, f)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs font-medium capitalize transicion",
              estado === f
                ? "border-borde bg-panel-2 text-texto"
                : "border-transparent text-apagado hover:bg-panel-2 hover:text-texto"
            )}
          >
            {f}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-borde bg-panel">
        <table className="tabla-tarjeta w-full text-sm">
          <thead>
            <tr className="border-b border-borde text-left text-[0.68rem] tracking-[0.1em] text-apagado uppercase">
              <th className="px-5 py-3 font-semibold">Pedido</th>
              <th className="px-5 py-3 font-semibold">Cliente</th>
              <th className="px-5 py-3 font-semibold">Fecha</th>
              <th className="px-5 py-3 text-right font-semibold">Ítems</th>
              <th className="px-5 py-3 text-right font-semibold">Total</th>
              <th className="px-5 py-3 text-right font-semibold">Estado</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {pedidos.map((p) => {
              const estaAbierto = abierto === p.id;
              const siguiente = SIGUIENTE[p.estado];
              return (
                <Fragment key={p.id}>
                  <tr className="border-b border-borde/70 transition-colors last:border-0 hover:bg-panel-2/50">
                    <td className="px-5 py-3.5 font-semibold text-texto cifra" data-principal>
                      #{p.numero}
                    </td>
                    <td className="px-5 py-3.5 text-claro" data-col="Cliente">
                      {p.cliente}
                    </td>
                    <td className="px-5 py-3.5 text-apagado" data-col="Fecha">
                      {fecha.format(new Date(p.creadoEn))}
                    </td>
                    <td className="px-5 py-3.5 text-right text-apagado cifra" data-col="Ítems">
                      {p.lineas.reduce((s, l) => s + l.cantidad, 0)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-texto cifra" data-col="Total">
                      {aPesos(p.totalCentavos)}
                    </td>
                    <td className="px-5 py-3.5 text-right" data-col="Estado">
                      <select
                        value={p.estado}
                        onChange={(e) => cambiarEstado(p.id, e.target.value as EstadoPedido)}
                        className="rounded-md border border-borde bg-hundido px-2 py-1.5 text-xs text-texto capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento"
                        aria-label={`Estado del pedido ${p.numero}`}
                      >
                        {ESTADOS.map((e) => (
                          <option key={e} value={e}>
                            {e}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-right" data-col="">
                      <div className="flex items-center justify-end gap-1">
                        {siguiente && (
                          <button
                            type="button"
                            onClick={() =>
                              cambiarEstado(p.id, siguiente.estado, `Pedido #${p.numero}: ${siguiente.texto.toLowerCase()}`)
                            }
                            className="hidden rounded-md border border-borde px-2.5 py-1 text-[0.7rem] font-medium text-claro transicion hover:bg-panel-2 hover:text-texto sm:inline-block"
                          >
                            {siguiente.texto.replace("Marcar como ", "→ ")}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setAbierto(estaAbierto ? null : p.id)}
                          aria-expanded={estaAbierto}
                          aria-label={`Ver detalle del pedido ${p.numero}`}
                          className="rounded-md p-1 text-apagado transicion hover:bg-panel-2 hover:text-texto"
                        >
                          <ChevronDown className={cn("size-4 transition-transform", estaAbierto && "rotate-180")} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {estaAbierto && (
                    <tr className="border-b border-borde/70 bg-hundido/40 last:border-0">
                      <td colSpan={7} className="px-5 py-4" data-col="">
                        <div className="grid gap-6 md:grid-cols-2">
                          <div>
                            <p className="mb-2 text-[0.68rem] font-semibold tracking-[0.12em] text-apagado uppercase">
                              Contacto y entrega
                            </p>
                            <div className="space-y-1 text-sm">
                              <p className="font-medium text-texto">{p.cliente}</p>
                              <p className="text-claro">{p.telefono}</p>
                              <p className="text-claro">{p.email || "—"}</p>
                              <p className="mt-1 text-apagado">{p.direccion || "Sin dirección"}</p>
                            </div>
                            <div className="mt-3">
                              <Badge tono={tonoDeEstado(p.estado)}>{p.estado}</Badge>
                            </div>
                          </div>
                          <div>
                            <p className="mb-2 text-[0.68rem] font-semibold tracking-[0.12em] text-apagado uppercase">
                              Detalle
                            </p>
                            <ul className="space-y-2">
                              {p.lineas.map((l, i) => (
                                <li key={i} className="flex justify-between gap-3 text-sm">
                                  <span className="text-claro">
                                    {l.cantidad}× {l.nombre} <span className="text-apagado">· {l.variante}</span>
                                  </span>
                                  <span className="shrink-0 font-medium text-texto cifra">
                                    {aPesos(l.precioCentavos * l.cantidad)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                            <div className="mt-3 flex items-baseline justify-between border-t border-borde pt-3">
                              <span className="text-[0.7rem] font-semibold tracking-[0.12em] text-apagado uppercase">
                                Total
                              </span>
                              <span className="text-base font-bold text-texto cifra">
                                {aPesos(p.totalCentavos)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-borde pt-4">
                          {siguiente && (
                            <button
                              type="button"
                              onClick={() =>
                                cambiarEstado(p.id, siguiente.estado, `Pedido #${p.numero}: ${siguiente.texto.toLowerCase()}`)
                              }
                              className="rounded-md bg-acento px-3.5 py-2 text-xs font-semibold text-acento-oscuro transicion hover:opacity-90"
                            >
                              {siguiente.texto}
                            </button>
                          )}
                          {p.estado !== "cancelado" && p.estado !== "entregado" && (
                            <button
                              type="button"
                              onClick={() => cambiarEstado(p.id, "cancelado", `Pedido #${p.numero} cancelado`)}
                              className="rounded-md border border-borde px-3.5 py-2 text-xs font-medium text-apagado transicion hover:border-mal/50 hover:text-mal"
                            >
                              Cancelar pedido
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {pedidos.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-apagado" data-col="">
                  No hay pedidos que coincidan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-apagado">
            Página {pagina} de {totalPaginas}
          </span>
          <div className="flex gap-2">
            {pagina > 1 && (
              <Link
                href={href(pagina - 1, estado)}
                className="inline-flex items-center gap-1 rounded-md border border-borde px-3 py-1.5 text-xs font-medium text-claro transicion hover:bg-panel-2"
              >
                <ChevronLeft className="size-3.5" aria-hidden />
                Anterior
              </Link>
            )}
            {pagina < totalPaginas && (
              <Link
                href={href(pagina + 1, estado)}
                className="inline-flex items-center gap-1 rounded-md border border-borde px-3 py-1.5 text-xs font-medium text-claro transicion hover:bg-panel-2"
              >
                Siguiente
                <ChevronRight className="size-3.5" aria-hidden />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
