"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ClipboardList, LayoutGrid, LogOut, Menu, Package, Search, Settings, Store, X } from "lucide-react";
import { MIS_SERVICIOS } from "@/lib/panel";
import { cn } from "@/lib/utils";
import { ProveedorAvisos } from "@/components/ui/toast";
import { Paleta } from "@/components/admin/paleta";

/* =========================================================
   Marco del admin — barra lateral
   ---------------------------------------------------------
   Barra fija en escritorio; panel deslizante en móvil. Arriba, un botón
   de búsqueda que abre la paleta de comandos (Ctrl/Cmd + K): ir a Pedidos
   en dos teclas es más rápido que apuntar con el ratón.

   El admin va en el tema oscuro de la plataforma: es una herramienta
   interna, y así se distingue de la tienda pública (clara).
   ========================================================= */

const SECCIONES = [
  { href: "/", texto: "Resumen", exacto: true, icono: LayoutGrid },
  { href: "/productos", texto: "Productos", icono: Package },
  { href: "/pedidos", texto: "Pedidos", icono: ClipboardList },
  { href: "/configuracion", texto: "Configuración", icono: Settings },
];

export function Marco({ children, tiendaSlug }: { children: ReactNode; tiendaSlug: string }) {
  const ruta = usePathname();
  const [menu, setMenu] = useState(false);
  const [paleta, setPaleta] = useState(false);

  useEffect(() => {
    function alTeclear(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaleta((p) => !p);
      }
      if (e.key === "Escape") setPaleta(false);
    }
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, []);

  return (
    <ProveedorAvisos>
      <div className="flex min-h-dvh bg-fondo">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-borde bg-panel lg:flex">
          <Marca />
          <BotonBuscar onClick={() => setPaleta(true)} />
          <Navegacion ruta={ruta} />
          <AccionesLaterales tiendaSlug={tiendaSlug} />
        </aside>

        {menu && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Cerrar menú"
              className="absolute inset-0 bg-black/60"
              onClick={() => setMenu(false)}
            />
            <aside className="absolute top-0 left-0 flex h-full w-64 flex-col border-r border-borde bg-panel">
              <div className="flex items-center justify-between pr-2">
                <Marca />
                <button
                  type="button"
                  aria-label="Cerrar"
                  className="rounded-md p-2 text-apagado transicion hover:bg-panel-2 hover:text-texto"
                  onClick={() => setMenu(false)}
                >
                  <X className="size-5" />
                </button>
              </div>
              <BotonBuscar
                onClick={() => {
                  setMenu(false);
                  setPaleta(true);
                }}
              />
              <Navegacion ruta={ruta} onNavegar={() => setMenu(false)} />
              <AccionesLaterales tiendaSlug={tiendaSlug} />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-1 border-b border-borde bg-panel px-3 py-2.5 lg:hidden">
            <button
              type="button"
              aria-label="Abrir menú"
              className="rounded-md p-2 text-texto transicion hover:bg-panel-2"
              onClick={() => setMenu(true)}
            >
              <Menu className="size-5" />
            </button>
            <span className="text-sm font-bold text-texto">Mini Shop</span>
            <button
              type="button"
              aria-label="Buscar"
              className="ml-auto rounded-md p-2 text-texto transicion hover:bg-panel-2"
              onClick={() => setPaleta(true)}
            >
              <Search className="size-5" />
            </button>
          </header>

          <main className="mx-auto w-full max-w-[80rem] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>

      <Paleta abierta={paleta} onCerrar={() => setPaleta(false)} tiendaSlug={tiendaSlug} />
    </ProveedorAvisos>
  );
}

function Marca() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-5 py-5">
      <span className="flex size-9 items-center justify-center rounded-lg bg-acento text-acento-oscuro">
        <Store className="size-5" aria-hidden />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-bold text-texto">Mini Shop</span>
        <span className="block text-[0.66rem] font-medium tracking-[0.18em] text-apagado uppercase">
          Admin
        </span>
      </span>
    </Link>
  );
}

function BotonBuscar({ onClick }: { onClick: () => void }) {
  return (
    <div className="px-3 pb-2">
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-lg border border-borde bg-hundido px-3 py-2.5 text-sm text-apagado transicion hover:border-borde-fuerte hover:text-texto"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="flex-1 text-left">Buscar…</span>
        <kbd className="rounded border border-borde px-1.5 py-0.5 text-[0.6rem]">Ctrl K</kbd>
      </button>
    </div>
  );
}

function Navegacion({ ruta, onNavegar }: { ruta: string; onNavegar?: () => void }) {
  return (
    <nav aria-label="Secciones" className="flex-1 space-y-1 px-3 py-2">
      {SECCIONES.map((s) => {
        const activo = s.exacto ? ruta === s.href : ruta.startsWith(s.href);
        const Icono = s.icono;
        return (
          <Link
            key={s.href}
            href={s.href}
            onClick={onNavegar}
            aria-current={activo ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transicion",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento",
              activo
                ? "bg-panel-2 font-semibold text-texto"
                : "font-medium text-apagado hover:bg-panel-2 hover:text-texto"
            )}
          >
            <Icono className={cn("size-4.5 shrink-0", activo ? "text-acento" : "text-apagado")} aria-hidden />
            {s.texto}
          </Link>
        );
      })}
    </nav>
  );
}

function AccionesLaterales({ tiendaSlug }: { tiendaSlug: string }) {
  return (
    <div className="space-y-1 border-t border-borde p-3">
      <Link
        href={`/tienda/${tiendaSlug}`}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-apagado transicion hover:bg-panel-2 hover:text-texto"
      >
        <Store className="size-4.5 shrink-0" aria-hidden />
        Ver tienda
      </Link>
      <a
        href={MIS_SERVICIOS}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-apagado transicion hover:bg-panel-2 hover:text-texto"
      >
        <LogOut className="size-4.5 shrink-0" aria-hidden />
        Mi panel
      </a>
    </div>
  );
}
