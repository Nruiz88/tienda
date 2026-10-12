import type { Pedido, Producto, Tienda } from "./tipos";

/* =========================================================
   Datos de demostración — una tienda de ropa
   ---------------------------------------------------------
   Existen para VER y RETOCAR el diseño sin Supabase, sin ticket y sin
   sesión. No son la base: son el relleno del preview.

   Los precios van en CENTAVOS (entero). `aPesos()` los formatea.
   ========================================================= */

/* Marca de ejemplo, como SVG embebido: así se ve el logo y el banner SIN
   Subir archivos ni depender de internet. Al subir los de verdad, estos
   se reemplazan. */
const LOGO_DEMO =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="22" fill="#1b1916"/><text x="60" y="80" font-family="Georgia, serif" font-size="64" fill="#f6f4f0" text-anchor="middle">N</text></svg>`
  );

const BANNER_DEMO =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900"><rect width="1200" height="900" fill="#e9e4db"/><circle cx="880" cy="250" r="300" fill="#ded6c7"/><circle cx="300" cy="720" r="240" fill="#e3dacb"/><text x="70" y="820" font-family="Georgia, serif" font-size="84" fill="#1b1916">Nueva temporada</text></svg>`
  );

export const TIENDA: Tienda = {
  slug: "demo",
  nombre: "Nordés",
  descripcion:
    "Prendas de temporada, cortes simples y telas nobles. Producción chica, hecha en Argentina.",
  logoUrl: LOGO_DEMO,
  bannerUrl: BANNER_DEMO,
};

export const PRODUCTOS: Producto[] = [
  {
    id: "p-camisa-lino",
    slug: "camisa-de-lino",
    nombre: "Camisa de lino",
    descripcion: "Lino lavado, manga larga, corte holgado. Un botón de repuesto.",
    categoria: "Hombre",
    imagenes: ["👔"],
    activo: true,
    variantes: [
      { id: "v-camisa-s", nombre: "S", precioCentavos: 5800000, stock: 8 },
      { id: "v-camisa-m", nombre: "M", precioCentavos: 5800000, stock: 6 },
      { id: "v-camisa-l", nombre: "L", precioCentavos: 5800000, stock: 4 },
      { id: "v-camisa-xl", nombre: "XL", precioCentavos: 5800000, stock: 3 },
    ],
  },
  {
    id: "p-remera-algodon",
    slug: "remera-de-algodon",
    nombre: "Remera de algodón",
    descripcion: "Algodón peinado 24/1, cuello redondo reforzado. El básico de siempre.",
    categoria: "Hombre",
    imagenes: ["👕"],
    activo: true,
    variantes: [
      { id: "v-remera-xs", nombre: "XS", precioCentavos: 2400000, stock: 12 },
      { id: "v-remera-s", nombre: "S", precioCentavos: 2400000, stock: 20 },
      { id: "v-remera-m", nombre: "M", precioCentavos: 2400000, stock: 18 },
      { id: "v-remera-l", nombre: "L", precioCentavos: 2400000, stock: 10 },
      { id: "v-remera-xl", nombre: "XL", precioCentavos: 2400000, stock: 6 },
    ],
  },
  {
    id: "p-campera-cuero",
    slug: "campera-de-cuero",
    nombre: "Campera de cuero",
    descripcion: "Cuero vacuno curtido al vegetal. Forro de sarga.",
    categoria: "Hombre",
    imagenes: ["🧥"],
    activo: true,
    variantes: [
      { id: "v-campera-s", nombre: "S", precioCentavos: 16500000, stock: 0 },
      { id: "v-campera-m", nombre: "M", precioCentavos: 16500000, stock: 0 },
      { id: "v-campera-l", nombre: "L", precioCentavos: 16500000, stock: 0 },
    ],
  },
  {
    id: "p-vestido-midi",
    slug: "vestido-midi",
    nombre: "Vestido midi",
    descripcion: "Viscosa con caída. Cinturón del mismo tono, bolsillos ocultos.",
    categoria: "Mujer",
    imagenes: ["👗"],
    activo: true,
    variantes: [
      { id: "v-vestido-xs", nombre: "XS", precioCentavos: 7200000, stock: 5 },
      { id: "v-vestido-s", nombre: "S", precioCentavos: 7200000, stock: 7 },
      { id: "v-vestido-m", nombre: "M", precioCentavos: 7200000, stock: 4 },
      { id: "v-vestido-l", nombre: "L", precioCentavos: 7200000, stock: 2 },
    ],
  },
  {
    id: "p-sweater-lana",
    slug: "sweater-de-lana",
    nombre: "Sweater de lana",
    descripcion: "Lana merino, tejido grueso. Cuello alto y puños anchos.",
    categoria: "Mujer",
    imagenes: ["🧶"],
    activo: true,
    variantes: [
      { id: "v-sweater-xs", nombre: "XS", precioCentavos: 4600000, stock: 9 },
      { id: "v-sweater-s", nombre: "S", precioCentavos: 4600000, stock: 11 },
      { id: "v-sweater-m", nombre: "M", precioCentavos: 4600000, stock: 7 },
      { id: "v-sweater-l", nombre: "L", precioCentavos: 4600000, stock: 5 },
    ],
  },
  {
    id: "p-pantalon-sastre",
    slug: "pantalon-sastre",
    nombre: "Pantalón sastre",
    descripcion: "Pinza delantera, tiro alto. Mezcla con algo de stretch.",
    categoria: "Mujer",
    imagenes: ["👖"],
    activo: true,
    variantes: [
      { id: "v-sastre-36", nombre: "36", precioCentavos: 5500000, stock: 4 },
      { id: "v-sastre-38", nombre: "38", precioCentavos: 5500000, stock: 6 },
      { id: "v-sastre-40", nombre: "40", precioCentavos: 5500000, stock: 5 },
      { id: "v-sastre-42", nombre: "42", precioCentavos: 5500000, stock: 2 },
    ],
  },
  {
    id: "p-jean-recto",
    slug: "jean-recto",
    nombre: "Jean recto",
    descripcion: "Denim rígido 13 oz, tiro medio. Envejecido a la piedra.",
    categoria: "Hombre",
    imagenes: ["👖"],
    activo: true,
    variantes: [
      { id: "v-jean-40", nombre: "40", precioCentavos: 6400000, stock: 7 },
      { id: "v-jean-42", nombre: "42", precioCentavos: 6400000, stock: 9 },
      { id: "v-jean-44", nombre: "44", precioCentavos: 6400000, stock: 6 },
      { id: "v-jean-46", nombre: "46", precioCentavos: 6400000, stock: 3 },
    ],
  },
  {
    id: "p-zapatillas-lona",
    slug: "zapatillas-de-lona",
    nombre: "Zapatillas de lona",
    descripcion: "Suela de goma vulcanizada, plantilla de algodón. Lavables.",
    categoria: "Calzado",
    imagenes: ["👟"],
    activo: true,
    variantes: [
      { id: "v-zapa-38", nombre: "38", precioCentavos: 8900000, stock: 3 },
      { id: "v-zapa-39", nombre: "39", precioCentavos: 8900000, stock: 5 },
      { id: "v-zapa-40", nombre: "40", precioCentavos: 8900000, stock: 8 },
      { id: "v-zapa-41", nombre: "41", precioCentavos: 8900000, stock: 6 },
      { id: "v-zapa-42", nombre: "42", precioCentavos: 8900000, stock: 4 },
      { id: "v-zapa-43", nombre: "43", precioCentavos: 8900000, stock: 2 },
      { id: "v-zapa-44", nombre: "44", precioCentavos: 8900000, stock: 1 },
    ],
  },
  {
    id: "p-botineta-cuero",
    slug: "botineta-de-cuero",
    nombre: "Botineta de cuero",
    descripcion: "Cuero flor entera, suela cosida. Se ablanda con el uso.",
    categoria: "Calzado",
    imagenes: ["👞"],
    activo: false,
    variantes: [
      { id: "v-botin-39", nombre: "39", precioCentavos: 12400000, stock: 2 },
      { id: "v-botin-40", nombre: "40", precioCentavos: 12400000, stock: 4 },
      { id: "v-botin-41", nombre: "41", precioCentavos: 12400000, stock: 3 },
      { id: "v-botin-42", nombre: "42", precioCentavos: 12400000, stock: 2 },
      { id: "v-botin-43", nombre: "43", precioCentavos: 12400000, stock: 1 },
    ],
  },
  {
    id: "p-gorra-sarga",
    slug: "gorra-de-sarga",
    nombre: "Gorra de sarga",
    descripcion: "Algodón sarga, correa ajustable. Bordado tono sobre tono.",
    categoria: "Accesorios",
    imagenes: ["🧢"],
    activo: true,
    variantes: [{ id: "v-gorra-u", nombre: "Único", precioCentavos: 1800000, stock: 25 }],
  },
  {
    id: "p-bufanda-lana",
    slug: "bufanda-de-lana",
    nombre: "Bufanda de lana",
    descripcion: "Lana gruesa, 180 × 30 cm. Flecos anudados a mano.",
    categoria: "Accesorios",
    imagenes: ["🧣"],
    activo: true,
    variantes: [{ id: "v-bufanda-u", nombre: "Único", precioCentavos: 2600000, stock: 6 }],
  },
  {
    id: "p-medias-pack",
    slug: "medias-pack-x3",
    nombre: "Medias (pack x3)",
    descripcion: "Tres pares de algodón, caña media. Talles surtidos.",
    categoria: "Accesorios",
    imagenes: ["🧦"],
    activo: true,
    variantes: [{ id: "v-medias-u", nombre: "Único", precioCentavos: 1200000, stock: 40 }],
  },
];

const HOY = new Date();
const dias = (n: number) => new Date(HOY.getTime() - n * 86400000).toISOString();

export const PEDIDOS: Pedido[] = [
  {
    id: "o-1042",
    numero: 1042,
    cliente: "María López",
    telefono: "+54 9 11 5555-1201",
    email: "maria@example.com",
    direccion: "Av. Rivadavia 1234, CABA",
    creadoEn: dias(0),
    estado: "pendiente",
    totalCentavos: 10600000,
    lineas: [
      { productoId: "p-vestido-midi", varianteId: "v-vestido-m", nombre: "Vestido midi", variante: "M", precioCentavos: 7200000, cantidad: 1 },
      { productoId: "p-bufanda-lana", varianteId: "v-bufanda-u", nombre: "Bufanda de lana", variante: "Único", precioCentavos: 2600000, cantidad: 1 },
      { productoId: "p-medias-pack", varianteId: "v-medias-u", nombre: "Medias (pack x3)", variante: "Único", precioCentavos: 1200000, cantidad: 1 },
    ],
  },
  {
    id: "o-1041",
    numero: 1041,
    cliente: "Jorge Peña",
    telefono: "+54 9 11 5555-8890",
    email: "jorge@example.com",
    direccion: "Sarmiento 480, Rosario",
    creadoEn: dias(1),
    estado: "pagado",
    totalCentavos: 12800000,
    lineas: [
      { productoId: "p-jean-recto", varianteId: "v-jean-42", nombre: "Jean recto", variante: "42", precioCentavos: 6400000, cantidad: 2 },
    ],
  },
  {
    id: "o-1040",
    numero: 1040,
    cliente: "Lucía Fernández",
    telefono: "+54 9 11 5555-3321",
    email: "lucia@example.com",
    direccion: "Mitre 77, La Plata",
    creadoEn: dias(2),
    estado: "enviado",
    totalCentavos: 11300000,
    lineas: [
      { productoId: "p-camisa-lino", varianteId: "v-camisa-m", nombre: "Camisa de lino", variante: "M", precioCentavos: 5800000, cantidad: 1 },
      { productoId: "p-pantalon-sastre", varianteId: "v-sastre-40", nombre: "Pantalón sastre", variante: "40", precioCentavos: 5500000, cantidad: 1 },
    ],
  },
  {
    id: "o-1039",
    numero: 1039,
    cliente: "Pedro Gómez",
    telefono: "+54 9 11 5555-7788",
    email: "pedro@example.com",
    direccion: "Belgrano 900, Córdoba",
    creadoEn: dias(4),
    estado: "entregado",
    totalCentavos: 8900000,
    lineas: [
      { productoId: "p-zapatillas-lona", varianteId: "v-zapa-41", nombre: "Zapatillas de lona", variante: "41", precioCentavos: 8900000, cantidad: 1 },
    ],
  },
  {
    id: "o-1038",
    numero: 1038,
    cliente: "Ana Ruiz",
    telefono: "+54 9 11 5555-0099",
    email: "ana@example.com",
    direccion: "San Martín 12, Mendoza",
    creadoEn: dias(6),
    estado: "cancelado",
    totalCentavos: 4600000,
    lineas: [
      { productoId: "p-sweater-lana", varianteId: "v-sweater-s", nombre: "Sweater de lana", variante: "S", precioCentavos: 4600000, cantidad: 1 },
    ],
  },
];
