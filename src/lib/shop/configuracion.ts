import { MODO_DISENO } from "@/lib/modo";

/* =========================================================
   Configuración de la tienda
   ---------------------------------------------------------
   Lo que el dueño ajusta: contacto y redes, datos de transferencia y las
   claves de MercadoPago.

   ⚠️  EL ACCESS TOKEN DE MERCADOPAGO NO BAJA AL NAVEGADOR
   ------------------------------------------------------
   El access token es un SECRETO: con él se cobra y se devuelve dinero.
   Por eso `Configuracion` (lo que ve el formulario) solo lleva un booleano
   `accessTokenConfigurado`, y el token solo viaja del navegador al servidor
   cuando el dueño escribe uno NUEVO. Nunca al revés.
   ========================================================= */

export interface Configuracion {
  whatsapp: string;
  email: string;
  instagram: string;
  facebook: string;
  transferencia: {
    titular: string;
    banco: string;
    cbu: string;
    alias: string;
  };
  mercadopago: {
    publicKey: string;
    /** Si ya hay un access token guardado. EL TOKEN NO SE MANDA. */
    accessTokenConfigurado: boolean;
  };
}

/** Lo que el formulario manda al guardar. `accessToken` solo si es nuevo. */
export interface DatosConfig {
  whatsapp: string;
  email: string;
  instagram: string;
  facebook: string;
  transferencia: { titular: string; banco: string; cbu: string; alias: string };
  mercadopago: { publicKey: string; accessToken?: string };
  /* Marca: se guardan en `shop_tiendas`, no en la tabla de configuración. */
  logoUrl: string;
  bannerUrl: string;
}

/** La marca de la tienda (logo y banner). Vive en `shop_tiendas`. */
export interface Marca {
  logoUrl: string;
  bannerUrl: string;
}

export const CONFIG_VACIA: Configuracion = {
  whatsapp: "",
  email: "",
  instagram: "",
  facebook: "",
  transferencia: { titular: "", banco: "", cbu: "", alias: "" },
  mercadopago: { publicKey: "", accessTokenConfigurado: false },
};

export const CONFIG_DEMO: Configuracion = {
  whatsapp: "+54 9 11 5555-0000",
  email: "hola@nordes.com.ar",
  instagram: "nordes.ba",
  facebook: "nordes.ba",
  transferencia: {
    titular: "Nordés SRL",
    banco: "Banco Nación",
    cbu: "0110599620000012345678",
    alias: "NORDES.TIENDA",
  },
  mercadopago: { publicKey: "APP_USR-1a2b3c4d-...", accessTokenConfigurado: true },
};

/* ── Acceso a los datos ────────────────────────────────────────────── */

export async function obtenerConfiguracion(clientId: string): Promise<Configuracion> {
  if (MODO_DISENO) return CONFIG_DEMO;

  const { getAdmin } = await import("@/lib/db");
  const { data } = await getAdmin()
    .from("shop_configuracion")
    .select(
      "whatsapp, email, instagram, facebook, transf_titular, transf_banco, transf_cbu, transf_alias, mercadopago_public_key, mercadopago_access_token"
    )
    .eq("client_id", clientId)
    .maybeSingle();

  if (!data) return CONFIG_VACIA;

  /* Se lee el token solo para saber si EXISTE; no se devuelve. */
  return {
    whatsapp: data.whatsapp ?? "",
    email: data.email ?? "",
    instagram: data.instagram ?? "",
    facebook: data.facebook ?? "",
    transferencia: {
      titular: data.transf_titular ?? "",
      banco: data.transf_banco ?? "",
      cbu: data.transf_cbu ?? "",
      alias: data.transf_alias ?? "",
    },
    mercadopago: {
      publicKey: data.mercadopago_public_key ?? "",
      accessTokenConfigurado: Boolean(data.mercadopago_access_token),
    },
  };
}

export async function guardarConfiguracion(clientId: string, datos: DatosConfig): Promise<void> {
  if (MODO_DISENO) return;

  const { getAdmin } = await import("@/lib/db");
  const fila: Record<string, unknown> = {
    client_id: clientId,
    whatsapp: datos.whatsapp,
    email: datos.email,
    instagram: datos.instagram,
    facebook: datos.facebook,
    transf_titular: datos.transferencia.titular,
    transf_banco: datos.transferencia.banco,
    transf_cbu: datos.transferencia.cbu,
    transf_alias: datos.transferencia.alias,
    mercadopago_public_key: datos.mercadopago.publicKey,
  };

  /* El token SOLO se escribe si vinieron uno nuevo. Si el campo se dejó
     vacío, el token guardado se conserva: por eso no se manda `null`. */
  if (datos.mercadopago.accessToken) {
    fila.mercadopago_access_token = datos.mercadopago.accessToken;
  }

  const { error } = await getAdmin()
    .from("shop_configuracion")
    .upsert(fila, { onConflict: "client_id" });
  if (error) throw new Error("No se pudo guardar la configuración: " + error.message);

  /* La marca (logo y banner) vive en `shop_tiendas`. */
  const { error: errorMarca } = await getAdmin()
    .from("shop_tiendas")
    .update({ logo_url: datos.logoUrl || null, banner_url: datos.bannerUrl || null })
    .eq("client_id", clientId);
  if (errorMarca) throw new Error("No se pudo guardar la marca: " + errorMarca.message);
}

/* ── Configuración PÚBLICA (para la tienda) ────────────────────────── */

/** El trozo de la configuración que SÍ puede ver el comprador. Nunca
    incluye el access token de MercadoPago: solo si está configurado. */
export interface ConfiguracionPublica {
  whatsapp: string;
  email: string;
  instagram: string;
  facebook: string;
  transferencia: { titular: string; banco: string; cbu: string; alias: string };
  mercadopago: boolean;
}

function aPublica(c: Configuracion): ConfiguracionPublica {
  return {
    whatsapp: c.whatsapp,
    email: c.email,
    instagram: c.instagram,
    facebook: c.facebook,
    transferencia: c.transferencia,
    mercadopago: c.mercadopago.accessTokenConfigurado,
  };
}

export async function obtenerConfiguracionPublica(slug: string): Promise<ConfiguracionPublica> {
  if (MODO_DISENO) return aPublica(CONFIG_DEMO);

  const { getAdmin } = await import("@/lib/db");
  const admin = getAdmin();

  const { data: tienda } = await admin
    .from("shop_tiendas")
    .select("client_id")
    .eq("slug", slug)
    .maybeSingle();
  if (!tienda) return aPublica(CONFIG_VACIA);

  const { data } = await admin
    .from("shop_configuracion")
    .select(
      "whatsapp, email, instagram, facebook, transf_titular, transf_banco, transf_cbu, transf_alias, mercadopago_access_token"
    )
    .eq("client_id", tienda.client_id)
    .maybeSingle();
  if (!data) return aPublica(CONFIG_VACIA);

  return {
    whatsapp: data.whatsapp ?? "",
    email: data.email ?? "",
    instagram: data.instagram ?? "",
    facebook: data.facebook ?? "",
    transferencia: {
      titular: data.transf_titular ?? "",
      banco: data.transf_banco ?? "",
      cbu: data.transf_cbu ?? "",
      alias: data.transf_alias ?? "",
    },
    mercadopago: Boolean(data.mercadopago_access_token),
  };
}

/** El access token de MercadoPago de la tienda. SOLO servidor: nunca se
    manda al navegador. */
export async function obtenerAccessTokenMercadopago(slug: string): Promise<string | null> {
  if (MODO_DISENO) return null;

  const { getAdmin } = await import("@/lib/db");
  const admin = getAdmin();
  const { data: tienda } = await admin
    .from("shop_tiendas")
    .select("client_id")
    .eq("slug", slug)
    .maybeSingle();
  if (!tienda) return null;

  const { data } = await admin
    .from("shop_configuracion")
    .select("mercadopago_access_token")
    .eq("client_id", tienda.client_id)
    .maybeSingle();
  return data?.mercadopago_access_token ?? null;
}
