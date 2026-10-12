"use client";

import { useEffect } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";

/* Frontera de errores del admin. Si una pantalla revienta, en vez de una
   pantalla en blanco sale esto, con el botón de reintentar. */
export default function ErrorAdmin({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="flex size-14 items-center justify-center rounded-full border border-mal/40 bg-mal/10">
        <TriangleAlert className="size-6 text-mal" aria-hidden />
      </span>
      <h1 className="mt-5 text-xl font-bold text-texto">Algo se rompió</h1>
      <p className="mt-2 max-w-sm text-sm text-apagado">
        No se pudo cargar esta pantalla. Probá otra vez; si sigue, avisá.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-acento px-4 py-2.5 text-sm font-semibold text-acento-oscuro transicion hover:opacity-90"
      >
        <RotateCcw className="size-4" aria-hidden />
        Reintentar
      </button>
      {error.digest && <p className="mt-4 text-xs text-apagado">ref: {error.digest}</p>}
    </div>
  );
}
