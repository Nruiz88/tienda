"use server";

import { sesionAdmin } from "@/lib/acceso/admin";
import { MODO_DISENO } from "@/lib/modo";

/* Sube una imagen al almacenamiento y devuelve su URL pública.

   El archivo llega como `File` dentro de un `FormData` (lo que permite un
   Server Action). Se guarda bajo la carpeta del cliente de la SESIÓN, así
   que un cliente no puede escribir en la carpeta de otro. */

const TIPOS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

const MAX_BYTES = 3 * 1024 * 1024;

export async function accionSubirImagen(formData: FormData) {
  if (MODO_DISENO) {
    return { ok: false as const, error: "En modo diseño la imagen solo se previsualiza." };
  }

  const sesion = await sesionAdmin();

  const archivo = formData.get("archivo");
  if (!(archivo instanceof File)) {
    return { ok: false as const, error: "No llegó ningún archivo." };
  }

  const ext = TIPOS[archivo.type];
  if (!ext) {
    return { ok: false as const, error: "Formato no permitido (PNG, JPG, WEBP, GIF o SVG)." };
  }
  if (archivo.size > MAX_BYTES) {
    return { ok: false as const, error: "La imagen supera los 3 MB." };
  }

  const carpeta = String(formData.get("carpeta") ?? "general").replace(/[^a-z0-9-]/gi, "") || "general";
  const ruta = `clientes/${sesion.clientId}/${carpeta}/${Date.now()}.${ext}`;

  const { getAdmin } = await import("@/lib/db");
  const admin = getAdmin();

  const { error } = await admin.storage
    .from("shop")
    .upload(ruta, archivo, { cacheControl: "3600", upsert: true, contentType: archivo.type });
  if (error) return { ok: false as const, error: "No se pudo subir: " + error.message };

  const { data } = admin.storage.from("shop").getPublicUrl(ruta);
  return { ok: true as const, url: data.publicUrl };
}
