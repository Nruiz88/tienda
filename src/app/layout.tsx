import type { ReactNode } from "react";
import "./globals.css";

/* =========================================================
   Layout raíz
   ---------------------------------------------------------
   Next.js exige uno. Aquí solo va el HTML y el <body>: el marco
   (navegación) lo pone cada grupo de rutas, porque el admin y la tienda
   pública tienen cabeceras distintas.

   ⚠️  EL LAYOUT RAÍZ NO LLEVA <body> DUPLICADO
   En App Router el <body> lo pone el layout, exactamente una vez. Si se
   añade también en un layout anidado, sale un error de hidratación.
   ========================================================= */

export const metadata = {
  title: "Mini Shop",
  description: "Tienda online multi-cliente",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
