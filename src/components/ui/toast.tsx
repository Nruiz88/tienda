"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Check } from "lucide-react";

/* =========================================================
   Avisos (toasts)
   ---------------------------------------------------------
   Cada acción del admin (activar un producto, marcar un pedido como
   enviado) tiene que decir que se hizo. Sin eso, la persona duda: ¿se
   guardó o no? Un aviso que aparece 2,6 s abajo resuelve esa duda sin
   frenar el trabajo.
   ========================================================= */

interface Aviso {
  id: number;
  mensaje: string;
}

const Ctx = createContext<(mensaje: string) => void>(() => {});

export function ProveedorAvisos({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  const avisar = useCallback((mensaje: string) => {
    const id = Date.now() + Math.random();
    setAvisos((t) => [...t, { id, mensaje }]);
    setTimeout(() => setAvisos((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  return (
    <Ctx.Provider value={avisar}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2 px-4"
      >
        {avisos.map((a) => (
          <div
            key={a.id}
            className="pointer-events-auto flex items-center gap-2.5 rounded-lg border border-borde bg-panel-2 px-4 py-2.5 text-sm text-texto shadow-xl"
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-ok/15 text-ok">
              <Check className="size-3.5" aria-hidden />
            </span>
            {a.mensaje}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useAvisos() {
  return useContext(Ctx);
}
