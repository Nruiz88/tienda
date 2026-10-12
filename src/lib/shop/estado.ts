import type { EstadoPedido } from "./tipos";

type Tono = "neutro" | "acento" | "ok" | "aviso" | "mal";

/** El color de cada estado, en un solo sitio. Si estuviera repartido, el
    mismo estado saldría de un color en el resumen y de otro en la lista. */
const TONOS: Record<EstadoPedido, Tono> = {
  pendiente: "aviso",
  pagado: "acento",
  enviado: "acento",
  entregado: "ok",
  cancelado: "mal",
};

export function tonoDeEstado(estado: EstadoPedido): Tono {
  return TONOS[estado] ?? "neutro";
}
