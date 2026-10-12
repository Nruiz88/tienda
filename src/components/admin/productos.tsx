"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from "lucide-react";
import type { Producto } from "@/lib/shop/tipos";
import { aPesos } from "@/lib/dinero";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useAvisos } from "@/components/ui/toast";
import { MediaProducto } from "@/components/tienda/media";
import { SubidorImagen } from "@/components/admin/subidor-imagen";
import {
  accionAlternarProducto,
  accionCrearProducto,
  accionGuardarProducto,
} from "@/app/(admin)/productos/actions";
import { cn } from "@/lib/utils";

/* Productos (admin). La BÚSQUEDA y la PAGINACIÓN van en el servidor; el
   filtro por categoría/estado y el orden se aplican a la página cargada.
   Alta, edición (con imágenes) y activar/desactivar van por Server Action. */

function stockDe(p: Producto): number {
  return p.variantes.reduce((s, v) => s + v.stock, 0);
}
function precioDesde(p: Producto): number {
  return Math.min(...p.variantes.map((v) => v.precioCentavos));
}

const PRIORIDAD = ["Mujer", "Hombre", "Calzado", "Accesorios"];
type Estado = "todos" | "activos" | "inactivos" | "agotados";
type Orden = "nombre" | "precio" | "stock";

const CAMPO =
  "w-full rounded-lg border border-borde bg-hundido px-3.5 py-2.5 text-sm text-texto placeholder:text-apagado focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento";
const ETIQUETA = "mb-1.5 block text-[0.7rem] font-semibold tracking-[0.14em] text-apagado uppercase";

export function ProductosAdmin({
  iniciales,
  total,
  pagina,
  porPagina,
  q,
}: {
  iniciales: Producto[];
  total: number;
  pagina: number;
  porPagina: number;
  q: string;
}) {
  const avisar = useAvisos();
  const [productos, setProductos] = useState<Producto[]>(iniciales);
  const [categoria, setCategoria] = useState("Todas");
  const [estado, setEstado] = useState<Estado>("todos");
  const [orden, setOrden] = useState<Orden>("nombre");
  const [nuevo, setNuevo] = useState(false);
  const [borrador, setBorrador] = useState<Producto | null>(null);
  const [nuevasImagenes, setNuevasImagenes] = useState<[string, string]>(["", ""]);
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));

  const categorias = useMemo(
    () => [
      "Todas",
      ...[...new Set(productos.map((p) => p.categoria))].sort(
        (a, b) => (PRIORIDAD.indexOf(a) + 1 || 99) - (PRIORIDAD.indexOf(b) + 1 || 99)
      ),
    ],
    [productos]
  );

  const filtrados = useMemo(() => {
    const lista = productos.filter((p) => {
      const enCat = categoria === "Todas" || p.categoria === categoria;
      const st = stockDe(p);
      const enEstado =
        estado === "todos" ||
        (estado === "activos" && p.activo) ||
        (estado === "inactivos" && !p.activo) ||
        (estado === "agotados" && st === 0);
      return enCat && enEstado;
    });
    const cmp: Record<Orden, (a: Producto, b: Producto) => number> = {
      nombre: (a, b) => a.nombre.localeCompare(b.nombre),
      precio: (a, b) => precioDesde(a) - precioDesde(b),
      stock: (a, b) => stockDe(a) - stockDe(b),
    };
    return [...lista].sort(cmp[orden]);
  }, [productos, categoria, estado, orden]);

  function hrefPagina(n: number) {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (n > 1) p.set("pagina", String(n));
    const s = p.toString();
    return "/productos" + (s ? "?" + s : "");
  }

  async function agregar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const nombre = String(d.get("nombre") ?? "").trim();
    if (!nombre) return;
    const descripcion = String(d.get("descripcion") ?? "").trim();
    const precio = Math.round(Number(d.get("precio") ?? 0) * 100);
    const stock = Math.max(0, Math.round(Number(d.get("stock") ?? 0)));
    const cat = String(d.get("categoria") ?? "General").trim() || "General";
    const imagenes = nuevasImagenes.filter(Boolean);
    const id = "p-" + nombre.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    setProductos((prev) => [
      {
        id,
        slug: id,
        nombre,
        descripcion,
        categoria: cat,
        imagenes,
        activo: true,
        variantes: [{ id: id + "-u", nombre: "Único", precioCentavos: precio, stock }],
      },
      ...prev,
    ]);
    setNuevo(false);
    setNuevasImagenes(["", ""]);
    avisar(`Producto “${nombre}” agregado`);

    const r = await accionCrearProducto({ nombre, descripcion, categoria: cat, precioCentavos: precio, stock, imagenes });
    if ("error" in r) avisar("No se guardó en la base: " + r.error);
  }

  function alternar(p: Producto) {
    setProductos((prev) => prev.map((x) => (x.id === p.id ? { ...x, activo: !x.activo } : x)));
    avisar(`“${p.nombre}” ${p.activo ? "desactivado" : "activado"}`);
    void accionAlternarProducto(p.id, !p.activo).then((r) => {
      if ("error" in r) avisar("No se guardó en la base: " + r.error);
    });
  }

  async function guardarBorrador() {
    if (!borrador) return;
    const producto = borrador;
    setProductos((prev) => prev.map((x) => (x.id === producto.id ? producto : x)));
    avisar(`“${producto.nombre}” guardado`);
    setBorrador(null);
    const r = await accionGuardarProducto(producto);
    if ("error" in r) avisar("No se guardó en la base: " + r.error);
  }

  function setImagen(indice: number, valor: string) {
    setBorrador((b) => {
      if (!b) return b;
      const imagenes = [...b.imagenes];
      imagenes[indice] = valor;
      return { ...b, imagenes };
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-texto">Productos</h1>
          <p className="mt-1 text-sm text-apagado">{total} en el catálogo</p>
        </div>
        <div className="flex items-center gap-2">
          <form method="get" action="/productos" className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-apagado" aria-hidden />
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar…"
              aria-label="Buscar productos"
              className="w-44 rounded-lg border border-borde bg-hundido py-2.5 pl-9 pr-3 text-sm text-texto placeholder:text-apagado focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento sm:w-56"
            />
          </form>
          <Button
            type="button"
            onClick={() => {
              if (!nuevo) setNuevasImagenes(["", ""]);
              setNuevo(!nuevo);
            }}
          >
            <Plus className="size-4" aria-hidden />
            Nuevo
          </Button>
        </div>
      </header>

      {nuevo && (
        <form onSubmit={agregar} className="grid gap-4 rounded-xl border border-borde bg-panel p-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <label htmlFor="nombre" className={ETIQUETA}>
              Nombre
            </label>
            <input id="nombre" name="nombre" required autoFocus className={CAMPO} />
          </div>
          <div>
            <label htmlFor="categoria" className={ETIQUETA}>
              Categoría
            </label>
            <input id="categoria" name="categoria" placeholder="Mujer" className={CAMPO} />
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <label htmlFor="descripcion" className={ETIQUETA}>
              Descripción (opcional)
            </label>
            <textarea id="descripcion" name="descripcion" rows={2} className={CAMPO} placeholder="Tela, corte, cuidados…" />
          </div>
          <div>
            <label htmlFor="precio" className={ETIQUETA}>
              Precio (ARS)
            </label>
            <input id="precio" name="precio" type="number" min="0" step="1" required className={CAMPO} />
          </div>
          <div>
            <label htmlFor="stock" className={ETIQUETA}>
              Stock inicial
            </label>
            <input id="stock" name="stock" type="number" min="0" step="1" defaultValue={0} className={CAMPO} />
          </div>

          <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2 lg:col-span-4">
            <SubidorImagen
              etiqueta="Imagen 1"
              valor={nuevasImagenes[0]}
              onChange={(v) => setNuevasImagenes((prev) => [v, prev[1]])}
            />
            <SubidorImagen
              etiqueta="Imagen 2 (opcional)"
              valor={nuevasImagenes[1]}
              onChange={(v) => setNuevasImagenes((prev) => [prev[0], v])}
            />
          </div>

          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
            <Button type="submit">Guardar producto</Button>
            <Button type="button" variant="ghost" onClick={() => setNuevo(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {(["todos", "activos", "inactivos", "agotados"] as const).map((e) => (
            <button
              key={e}
              type="button"
              data-compacto
              onClick={() => setEstado(e)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium capitalize transicion",
                estado === e
                  ? "border-borde bg-panel-2 text-texto"
                  : "border-transparent text-apagado hover:bg-panel-2 hover:text-texto"
              )}
            >
              {e}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-apagado">Ordenar</span>
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value as Orden)}
            className="rounded-md border border-borde bg-hundido px-2 py-1.5 text-xs text-texto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento"
            aria-label="Ordenar productos"
          >
            <option value="nombre">Nombre</option>
            <option value="precio">Precio</option>
            <option value="stock">Stock</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {categorias.map((c) => (
          <button
            key={c}
            type="button"
            data-compacto
            onClick={() => setCategoria(c)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs font-medium transicion",
              categoria === c
                ? "border-borde bg-panel-2 text-texto"
                : "border-transparent text-apagado hover:bg-panel-2 hover:text-texto"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-borde bg-panel">
        <table className="tabla-tarjeta w-full text-sm">
          <thead>
            <tr className="border-b border-borde text-left text-[0.68rem] tracking-[0.1em] text-apagado uppercase">
              <th className="px-5 py-3 font-semibold">Producto</th>
              <th className="px-5 py-3 font-semibold">Categoría</th>
              <th className="px-5 py-3 text-right font-semibold">Talles</th>
              <th className="px-5 py-3 text-right font-semibold">Stock</th>
              <th className="px-5 py-3 text-right font-semibold">Precio</th>
              <th className="px-5 py-3 text-right font-semibold">Estado</th>
              <th className="px-5 py-3 text-right font-semibold">Editar</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p) => {
              const stock = stockDe(p);
              return (
                <tr key={p.id} className="border-b border-borde/70 transition-colors last:border-0 hover:bg-panel-2/50">
                  <td className="px-5 py-3.5" data-principal>
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-borde bg-hundido">
                        <MediaProducto valor={p.imagenes[0]} alt={p.nombre} className="text-lg" />
                      </span>
                      <span className={cn("font-medium", p.activo ? "text-texto" : "text-apagado line-through")}>
                        {p.nombre}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-apagado" data-col="Categoría">
                    {p.categoria}
                  </td>
                  <td className="px-5 py-3.5 text-right text-apagado cifra" data-col="Talles">
                    {p.variantes.length}
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium cifra" data-col="Stock">
                    <span className={cn(stock === 0 ? "text-mal" : stock <= 5 ? "text-aviso" : "text-claro")}>
                      {stock}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-texto cifra" data-col="Precio">
                    {aPesos(precioDesde(p))}
                  </td>
                  <td className="px-5 py-3.5 text-right" data-col="Estado">
                    <button
                      type="button"
                      onClick={() => alternar(p)}
                      title="Activar / desactivar"
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.7rem] font-semibold transicion",
                        p.activo ? "border-ok/40 bg-ok/10 text-ok" : "border-borde bg-panel-2 text-apagado"
                      )}
                    >
                      <span className={cn("size-1.5 rounded-full", p.activo ? "bg-ok" : "bg-apagado")} />
                      {p.activo ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-right" data-col="Editar">
                    <button
                      type="button"
                      onClick={() => setBorrador(structuredClone(p))}
                      aria-label={`Editar ${p.nombre}`}
                      className="rounded-md p-1.5 text-apagado transicion hover:bg-panel-2 hover:text-texto"
                    >
                      <Pencil className="size-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-apagado" data-col="">
                  Ningún producto coincide.
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
                href={hrefPagina(pagina - 1)}
                className="inline-flex items-center gap-1 rounded-md border border-borde px-3 py-1.5 text-xs font-medium text-claro transicion hover:bg-panel-2"
              >
                <ChevronLeft className="size-3.5" aria-hidden />
                Anterior
              </Link>
            )}
            {pagina < totalPaginas && (
              <Link
                href={hrefPagina(pagina + 1)}
                className="inline-flex items-center gap-1 rounded-md border border-borde px-3 py-1.5 text-xs font-medium text-claro transicion hover:bg-panel-2"
              >
                Siguiente
                <ChevronRight className="size-3.5" aria-hidden />
              </Link>
            )}
          </div>
        </div>
      )}

      <Modal abierto={borrador !== null} onCerrar={() => setBorrador(null)} titulo="Editar producto">
        {borrador && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={ETIQUETA}>Nombre</label>
                <input
                  value={borrador.nombre}
                  onChange={(e) => setBorrador({ ...borrador, nombre: e.target.value })}
                  className={CAMPO}
                />
              </div>
              <div>
                <label className={ETIQUETA}>Categoría</label>
                <input
                  value={borrador.categoria}
                  onChange={(e) => setBorrador({ ...borrador, categoria: e.target.value })}
                  className={CAMPO}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={ETIQUETA}>Descripción</label>
                <textarea
                  value={borrador.descripcion}
                  onChange={(e) => setBorrador({ ...borrador, descripcion: e.target.value })}
                  rows={2}
                  className={CAMPO}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SubidorImagen
                etiqueta="Imagen 1"
                valor={borrador.imagenes[0] ?? ""}
                onChange={(v) => setImagen(0, v)}
              />
              <SubidorImagen
                etiqueta="Imagen 2 (opcional)"
                valor={borrador.imagenes[1] ?? ""}
                onChange={(v) => setImagen(1, v)}
              />
            </div>

            <div>
              <span className={ETIQUETA + " mb-2"}>Talles, precio y stock</span>
              <div className="space-y-2">
                {borrador.variantes.map((v, i) => (
                  <div key={v.id} className="grid grid-cols-[1fr_6rem_5rem_2.25rem] items-center gap-2">
                    <input
                      value={v.nombre}
                      onChange={(e) => {
                        const vs = [...borrador.variantes];
                        vs[i] = { ...v, nombre: e.target.value };
                        setBorrador({ ...borrador, variantes: vs });
                      }}
                      aria-label="Talle"
                      className={CAMPO}
                    />
                    <input
                      type="number"
                      min="0"
                      value={Math.round(v.precioCentavos / 100)}
                      onChange={(e) => {
                        const vs = [...borrador.variantes];
                        vs[i] = { ...v, precioCentavos: Math.round((Number(e.target.value) || 0) * 100) };
                        setBorrador({ ...borrador, variantes: vs });
                      }}
                      aria-label="Precio"
                      className={cn(CAMPO, "cifra")}
                    />
                    <input
                      type="number"
                      min="0"
                      value={v.stock}
                      onChange={(e) => {
                        const vs = [...borrador.variantes];
                        vs[i] = { ...v, stock: Math.max(0, Math.round(Number(e.target.value) || 0)) };
                        setBorrador({ ...borrador, variantes: vs });
                      }}
                      aria-label="Stock"
                      className={cn(CAMPO, "cifra")}
                    />
                    <button
                      type="button"
                      aria-label="Quitar talle"
                      onClick={() =>
                        setBorrador({ ...borrador, variantes: borrador.variantes.filter((x) => x.id !== v.id) })
                      }
                      className="flex size-9 items-center justify-center rounded-md text-apagado transicion hover:bg-panel-2 hover:text-mal"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
              {borrador.variantes.length === 0 && (
                <p className="py-3 text-center text-sm text-apagado">Sin talles. Agregá uno.</p>
              )}
              <button
                type="button"
                onClick={() =>
                  setBorrador({
                    ...borrador,
                    variantes: [
                      ...borrador.variantes,
                      { id: `${borrador.id}-${Date.now()}`, nombre: "Talle", precioCentavos: 0, stock: 0 },
                    ],
                  })
                }
                className="mt-3 flex items-center gap-1.5 text-xs font-medium text-acento transicion hover:gap-2.5"
              >
                <Plus className="size-3.5" aria-hidden />
                Agregar talle
              </button>
            </div>

            <div className="flex justify-end gap-2 border-t border-borde pt-4">
              <Button type="button" variant="ghost" onClick={() => setBorrador(null)}>
                Cancelar
              </Button>
              <Button type="button" onClick={guardarBorrador}>
                Guardar cambios
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
