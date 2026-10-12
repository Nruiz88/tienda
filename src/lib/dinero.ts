/* Formato de dinero. En pesos argentinos y sin decimales: un precio de
   tienda no lleva centavos, y mostrarlos solo añade ruido a la columna. */
const formateador = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function aPesos(centavos: number): string {
  return formateador.format(centavos / 100);
}
