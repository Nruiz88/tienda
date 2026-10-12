/* =========================================================
   Tipos del shop
   ---------------------------------------------------------
   El modelo mínimo de una tienda: catálogo con variantes, carrito y
   pedidos. Todos los importes van en CENTAVOS (enteros) para no arrastrar
   errores de coma flotante en las sumas.
   ========================================================= */

export interface Variante {
  id: string;
  nombre: string;
  precioCentavos: number;
  stock: number;
}

export interface Producto {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  /** Hasta 2 imágenes. Cada una puede ser una URL o un emoji de relleno. */
  imagenes: string[];
  activo: boolean;
  variantes: Variante[];
}

export interface LineaPedido {
  productoId: string;
  varianteId: string;
  nombre: string;
  variante: string;
  precioCentavos: number;
  cantidad: number;
}

export type EstadoPedido = "pendiente" | "pagado" | "enviado" | "entregado" | "cancelado";

export interface Pedido {
  id: string;
  numero: number;
  cliente: string;
  telefono: string;
  email: string;
  direccion: string;
  creadoEn: string;
  estado: EstadoPedido;
  totalCentavos: number;
  lineas: LineaPedido[];
}

export interface Tienda {
  slug: string;
  nombre: string;
  descripcion: string;
  /** URL pública del logo y del banner. Vacío = se usa el texto/mosaico. */
  logoUrl?: string;
  bannerUrl?: string;
}

/** Una línea del carrito: lo que el navegador guarda entre visitas. */
export interface LineaCarrito {
  productoId: string;
  varianteId: string;
  nombre: string;
  variante: string;
  /** Emoji o URL, para la miniatura del carrito. */
  imagen?: string;
  precioCentavos: number;
  cantidad: number;
}

export const ESTADOS: EstadoPedido[] = [
  "pendiente",
  "pagado",
  "enviado",
  "entregado",
  "cancelado",
];
