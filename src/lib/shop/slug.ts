/** Convierte un texto en un id de ancla: "Accesorios" -> "accesorios".
    Para poder enlazar a una categoría desde la cabecera. */
export function aAncla(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Igual que `aAncla`, pero con nombre propio para slugs de tienda. */
export const slugificar = aAncla;

/** Orden "bonito" de categorías: el que quieras fijo, y el resto detrás. */
const ORDEN = ["Mujer", "Hombre", "Calzado", "Accesorios"];

export function ordenarCategorias(categorias: string[]): string[] {
  return [...categorias].sort((a, b) => {
    const ia = ORDEN.indexOf(a);
    const ib = ORDEN.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}
