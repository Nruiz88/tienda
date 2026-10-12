"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LineaCarrito, Variante } from "@/lib/shop/tipos";

/* =========================================================
   El carrito
   ---------------------------------------------------------
   Vive en el navegador: en `localStorage`, para que no se pierda al
   recargar. No hay usuario al que atarlo —el comprador del storefront es
   anónimo—, así que el carrito no puede vivir en el servidor sin
   inventarse una sesión de comprador.

   ⚠️  EL PRECIO SE GUARDA EN LA LÍNEA, NO SE BUSCA AL PINTAR
   ---------------------------------------------------------
   Guardar solo el id y buscar el precio en cada render es tentador, pero
   significa que un cambio de precio en el admin altera un carrito a
   medio armar. El precio se copia al añadir; el servidor lo revisa al
   crear el pedido de todos modos.
   ========================================================= */

interface Contexto {
  lineas: LineaCarrito[];
  cantidadTotal: number;
  totalCentavos: number;
  agregar: (
    producto: { id: string; nombre: string; imagen?: string },
    variante: Variante,
    cantidad?: number
  ) => void;
  cambiarCantidad: (varianteId: string, cantidad: number) => void;
  quitar: (varianteId: string) => void;
  vaciar: () => void;
}

const Carrito = createContext<Contexto | null>(null);
const CLAVE = "shop_carrito";

/* =========================================================
   Acceso a `localStorage` a prueba de fallos
   ---------------------------------------------------------
   ⚠️  ESTO NO ES PARANOIA, ES UN CRASH REAL EN FIREFOX
   -----------------------------------------------------
   Si el navegador tiene bloqueados los datos de sitio (Firefox con
   protección estricta, cookies desactivadas, o `localStorage` lleno),
   `localStorage.setItem` NO devuelve `null`: LANZA. Y si eso pasa dentro
   de un `useEffect`, se cae TODO el árbol de React y la página queda en
   blanco. En Chrome, en cambio, suele no pasar.

   Por eso todo acceso va envuelto: si el almacenamiento no está, el
   carrito sigue funcionando en memoria mientras dure la pestaña. Perder
   la persistencia es molesto; perder la página entera, no.
   ========================================================= */
function leerGuardado(): LineaCarrito[] {
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    const valor = crudo ? JSON.parse(crudo) : [];
    return Array.isArray(valor) ? valor : [];
  } catch {
    return [];
  }
}

function escribirGuardado(lineas: LineaCarrito[]): void {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(lineas));
  } catch {
    /* Sin persistencia, pero sin romper. */
  }
}

export function ProveedorCarrito({ children }: { children: ReactNode }) {
  const [lineas, setLineas] = useState<LineaCarrito[]>([]);
  const [listo, setListo] = useState(false);

  /* Se carga DESPUÉS del montaje: leer `localStorage` durante el render
     daría un HTML distinto en servidor y navegador (error de
     hidratación). */
  useEffect(() => {
    setLineas(leerGuardado());
    setListo(true);
  }, []);

  useEffect(() => {
    if (!listo) return;
    escribirGuardado(lineas);
  }, [lineas, listo]);

  const valor = useMemo<Contexto>(() => {
    const totalCentavos = lineas.reduce((s, l) => s + l.precioCentavos * l.cantidad, 0);
    const cantidadTotal = lineas.reduce((s, l) => s + l.cantidad, 0);

    return {
      lineas,
      totalCentavos,
      cantidadTotal,
      agregar(producto, variante, cantidad = 1) {
        setLineas((prev) => {
          const i = prev.findIndex((l) => l.varianteId === variante.id);
          if (i >= 0) {
            const copia = [...prev];
            copia[i] = { ...copia[i], cantidad: copia[i].cantidad + cantidad };
            return copia;
          }
          return [
            ...prev,
            {
              productoId: producto.id,
              varianteId: variante.id,
              nombre: producto.nombre,
              variante: variante.nombre,
              imagen: producto.imagen,
              precioCentavos: variante.precioCentavos,
              cantidad,
            },
          ];
        });
      },
      cambiarCantidad(varianteId, cantidad) {
        setLineas((prev) =>
          cantidad <= 0
            ? prev.filter((l) => l.varianteId !== varianteId)
            : prev.map((l) => (l.varianteId === varianteId ? { ...l, cantidad } : l))
        );
      },
      quitar(varianteId) {
        setLineas((prev) => prev.filter((l) => l.varianteId !== varianteId));
      },
      vaciar() {
        setLineas([]);
      },
    };
  }, [lineas]);

  return <Carrito.Provider value={valor}>{children}</Carrito.Provider>;
}

export function useCarrito(): Contexto {
  const c = useContext(Carrito);
  if (!c) throw new Error("useCarrito() solo funciona dentro de <ProveedorCarrito>.");
  return c;
}
