import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Junta clases de Tailwind resolviendo las que chocan.
 *
 * Sin esto, añadir `p-4` a un componente que ya trae `p-2` depende del
 * orden del HTML, y el espacio sale distinto según dónde se use.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
