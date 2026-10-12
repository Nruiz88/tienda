import Link from "next/link";

/* 404 general (fuera de una tienda). Tema oscuro, como el admin. */
export default function NoEncontrado() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <span className="text-[0.7rem] font-semibold tracking-[0.24em] text-apagado uppercase">
        Error 404
      </span>
      <h1 className="mt-4 text-3xl font-bold text-texto">Página no encontrada</h1>
      <p className="mt-3 max-w-md text-sm text-apagado">
        La dirección no existe o la movimos de lugar.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-md bg-acento px-6 py-3 text-xs font-semibold tracking-[0.16em] text-acento-oscuro uppercase transicion hover:opacity-90"
      >
        Volver
      </Link>
    </main>
  );
}
