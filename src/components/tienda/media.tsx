import { cn } from "@/lib/utils";
import { esImagenUrl } from "@/lib/shop/imagenes";

/* Muestra una imagen de producto o un emoji de relleno, ocupando el
   contenedor. Si el valor es una URL, va como <img>; si no, como texto
   (que es como se ven los emojis de demo). Funciona en servidor y en
   cliente por igual: no usa hooks. */
export function MediaProducto({
  valor,
  alt = "",
  className,
}: {
  valor?: string;
  alt?: string;
  className?: string;
}) {
  if (esImagenUrl(valor)) {
    return <img src={valor} alt={alt} className={cn("h-full w-full object-cover", className)} />;
  }
  return (
    <span className={cn("flex h-full w-full items-center justify-center", className)}>
      {valor || "📦"}
    </span>
  );
}
