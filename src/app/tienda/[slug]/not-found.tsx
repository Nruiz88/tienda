import Link from "next/link";

/* 404 de una tienda. Se ve cuando el slug no existe (o la tienda está
   inactiva). Va con su propio tema claro porque puede renderizarse fuera
   del layout de la tienda. */
export default function TiendaNoEncontrada() {
  return (
    <div className="tienda-tema flex min-h-dvh flex-col items-center justify-center bg-fondo px-6 text-center">
      <span className="text-[0.7rem] font-semibold tracking-[0.24em] text-apagado uppercase">
        Error 404
      </span>
      <h1 className="mt-4 font-display text-4xl text-texto">Esta tienda no existe</h1>
      <p className="mt-3 max-w-md text-sm text-apagado">
        Puede que el enlace esté mal o que la tienda ya no esté disponible.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-md bg-acento px-6 py-3 text-xs font-semibold tracking-[0.16em] text-acento-oscuro uppercase transicion hover:opacity-90"
      >
        Ir al inicio
      </Link>
    </div>
  );
}
