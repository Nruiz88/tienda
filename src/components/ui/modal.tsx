"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

/* Modal reutilizable. En móvil se apoya abajo (hoja), en escritorio se
   centra. Cierra con Escape y con clic en el fondo. */
export function Modal({
  abierto,
  onCerrar,
  titulo,
  children,
}: {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!abierto) return;
    function alTeclear(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
    }
    window.addEventListener("keydown", alTeclear);
    /* Bloquea el scroll de fondo mientras el modal está abierto. */
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", alTeclear);
      document.body.style.overflow = previo;
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/60"
        onClick={onCerrar}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="relative z-10 flex max-h-[85dvh] w-full max-w-lg flex-col rounded-t-2xl border border-borde bg-panel shadow-2xl sm:rounded-2xl"
      >
        <header className="flex items-center justify-between border-b border-borde px-5 py-4">
          <h2 className="text-sm font-semibold text-texto">{titulo}</h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-md p-1.5 text-apagado transicion hover:bg-panel-2 hover:text-texto"
          >
            <X className="size-4.5" />
          </button>
        </header>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
