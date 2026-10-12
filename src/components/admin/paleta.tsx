"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  LayoutGrid,
  LogOut,
  Package,
  Search,
  Settings,
  Store,
  type LucideIcon,
} from "lucide-react";
import { MIS_SERVICIOS } from "@/lib/panel";
import { cn } from "@/lib/utils";

/* =========================================================
   Paleta de comandos (Ctrl/Cmd + K)
   ---------------------------------------------------------
   Para quien usa el admin todos los días, ir a Pedidos en dos teclas es
   más rápido que apuntar con el ratón en la barra lateral. También
   funciona como "buscar" general: escribe y Enter.
   ========================================================= */

interface Comando {
  id: string;
  texto: string;
  grupo: string;
  icono: LucideIcon;
  href: string;
  externo?: boolean;
}

export function Paleta({
  abierta,
  onCerrar,
  tiendaSlug,
}: {
  abierta: boolean;
  onCerrar: () => void;
  tiendaSlug: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const comandos = useMemo<Comando[]>(
    () => [
      { id: "resumen", texto: "Ir a Resumen", grupo: "Navegar", icono: LayoutGrid, href: "/" },
      { id: "productos", texto: "Ir a Productos", grupo: "Navegar", icono: Package, href: "/productos" },
      { id: "pedidos", texto: "Ir a Pedidos", grupo: "Navegar", icono: ClipboardList, href: "/pedidos" },
      {
        id: "configuracion",
        texto: "Ir a Configuración",
        grupo: "Navegar",
        icono: Settings,
        href: "/configuracion",
      },
      {
        id: "tienda",
        texto: "Ver la tienda",
        grupo: "Tienda",
        icono: Store,
        href: `/tienda/${tiendaSlug}`,
        externo: true,
      },
      { id: "panel", texto: "Volver al panel", grupo: "Cuenta", icono: LogOut, href: MIS_SERVICIOS, externo: true },
    ],
    [tiendaSlug]
  );

  const filtrados = useMemo(
    () => comandos.filter((c) => c.texto.toLowerCase().includes(q.toLowerCase())),
    [comandos, q]
  );

  useEffect(() => {
    if (!abierta) return;
    setQ("");
    setSel(0);
    const t = setTimeout(() => inputRef.current?.focus(), 20);
    return () => clearTimeout(t);
  }, [abierta]);

  useEffect(() => {
    if (!abierta) return;
    function alTeclear(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSel((s) => Math.min(filtrados.length - 1, s + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSel((s) => Math.max(0, s - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const c = filtrados[sel];
        if (c) ejecutar(c);
      }
    }
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierta, filtrados, sel]);

  function ejecutar(c: Comando) {
    onCerrar();
    if (c.externo) {
      window.location.href = c.href;
      return;
    }
    router.push(c.href);
  }

  if (!abierta) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-start justify-center p-4 pt-[12vh]">
      <button type="button" aria-label="Cerrar" className="absolute inset-0 bg-black/60" onClick={onCerrar} />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-borde bg-panel shadow-2xl">
        <div className="flex items-center gap-3 border-b border-borde px-4">
          <Search className="size-4 shrink-0 text-apagado" aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSel(0);
            }}
            placeholder="Buscar o escribir un comando…"
            aria-label="Buscar"
            className="h-14 flex-1 bg-transparent text-sm text-texto placeholder:text-apagado focus:outline-none"
          />
          <kbd className="rounded border border-borde bg-hundido px-1.5 py-0.5 text-[0.66rem] text-apagado">
            Esc
          </kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto p-2">
          {filtrados.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-apagado">Nada coincide con “{q}”.</li>
          )}
          {filtrados.map((c, i) => {
            const Icono = c.icono;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onMouseEnter={() => setSel(i)}
                  onClick={() => ejecutar(c)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transicion",
                    i === sel ? "bg-panel-2 text-texto" : "text-apagado"
                  )}
                >
                  <Icono className={cn("size-4 shrink-0", i === sel ? "text-acento" : "text-apagado")} aria-hidden />
                  <span className="flex-1">{c.texto}</span>
                  <span className="text-[0.64rem] tracking-[0.12em] text-apagado uppercase">{c.grupo}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
