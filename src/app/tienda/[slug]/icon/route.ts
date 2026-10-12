import { obtenerTienda } from "@/lib/shop/catalogo";

export const dynamic = "force-dynamic";

/* Favicon por tienda: la inicial del nombre en un cuadro. Se genera como
   SVG, sin dependencias. El layout lo declara en `metadata.icons`. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tienda = await obtenerTienda(slug);
  const letra = (tienda?.nombre ?? "?").trim().charAt(0).toUpperCase() || "?";
  const segura = letra.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">` +
    `<rect width="64" height="64" rx="14" fill="#1b1916"/>` +
    `<text x="32" y="45" font-family="Georgia, serif" font-size="38" fill="#f6f4f0" text-anchor="middle">${segura}</text>` +
    `</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
