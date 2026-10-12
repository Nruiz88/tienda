import Link from "next/link";
import type { ConfiguracionPublica } from "@/lib/shop/configuracion";

/* Pie del storefront. Contacto y redes salen de la CONFIGURACIÓN de la
   tienda (lo que carga el dueño en el admin). Las columnas "Comprar" y
   "Ayuda" siguen siendo decorativas. */
export function Pie({
  nombre,
  slug,
  config,
}: {
  nombre: string;
  slug: string;
  config: ConfiguracionPublica;
}) {
  const sinArroba = (v: string) => v.replace(/^@/, "");
  const contacto: { texto: string; href: string }[] = [];
  if (config.whatsapp) {
    contacto.push({ texto: "WhatsApp", href: `https://wa.me/${config.whatsapp.replace(/\D/g, "")}` });
  }
  if (config.email) contacto.push({ texto: config.email, href: `mailto:${config.email}` });
  if (config.instagram) {
    contacto.push({ texto: "Instagram", href: `https://instagram.com/${sinArroba(config.instagram)}` });
  }
  if (config.facebook) {
    contacto.push({ texto: "Facebook", href: `https://facebook.com/${sinArroba(config.facebook)}` });
  }

  const comprar = ["Novedades", "Mujer", "Hombre", "Accesorios"];
  const ayuda = ["Envíos", "Cambios", "Guía de talles"];

  return (
    <footer className="mt-20 border-t border-borde bg-panel">
      <div className="mx-auto grid w-full max-w-[84rem] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Link href={`/tienda/${slug}`} className="font-display text-lg tracking-[0.25em] uppercase">
            {nombre}
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-apagado">
            Prendas de temporada, cortes simples y telas nobles.
          </p>
        </div>

        <div>
          <h3 className="text-[0.72rem] font-semibold tracking-[0.18em] text-texto uppercase">Comprar</h3>
          <ul className="mt-4 space-y-2.5">
            {comprar.map((e) => (
              <li key={e}>
                <span className="cursor-pointer text-sm text-apagado transicion hover:text-texto">{e}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-[0.72rem] font-semibold tracking-[0.18em] text-texto uppercase">Ayuda</h3>
          <ul className="mt-4 space-y-2.5">
            {ayuda.map((e) => (
              <li key={e}>
                <span className="cursor-pointer text-sm text-apagado transicion hover:text-texto">{e}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-[0.72rem] font-semibold tracking-[0.18em] text-texto uppercase">Contacto</h3>
          {contacto.length === 0 ? (
            <p className="mt-4 text-sm text-apagado">—</p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {contacto.map((c) => (
                <li key={c.texto}>
                  <a
                    href={c.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-apagado transicion hover:text-texto"
                  >
                    {c.texto}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="border-t border-borde">
        <div className="mx-auto flex w-full max-w-[84rem] flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-apagado sm:flex-row sm:px-6">
          <span>
            © {new Date().getFullYear()} {nombre}. Todos los derechos reservados.
          </span>
          <span className="tracking-[0.14em] uppercase">Transferencia · Tarjeta · Efectivo</span>
        </div>
      </div>
    </footer>
  );
}
