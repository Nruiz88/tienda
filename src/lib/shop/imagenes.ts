/** ¿Este valor es una imagen de verdad (URL/dato) o un emoji/texto? */
export function esImagenUrl(valor: string | undefined | null): boolean {
  if (!valor) return false;
  return /^(https?:\/\/|data:image\/|blob:|\/)/.test(valor);
}
