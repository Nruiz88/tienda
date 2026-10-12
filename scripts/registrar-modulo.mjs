#!/usr/bin/env node
/* =========================================================
   Registrar el módulo `mini-shop` en el panel
   ---------------------------------------------------------
   Hace dos cosas contra la base del panel:
     1. Da de alta el producto en `modules` (id `mini-shop`).
     2. Opcionalmente, le da la suscripción a un cliente (`suscripciones`).

   Uso:
     node scripts/registrar-modulo.mjs --url https://tienda.midominio.com
     node scripts/registrar-modulo.mjs --url http://localhost:3000 --cliente <uuid>

   `tiene_modulo(cliente,'mini-shop')` empieza a dar true con la suscripción.
   ========================================================= */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function leerEnv(ruta) {
  const salida = {};
  if (!fs.existsSync(ruta)) return salida;
  for (const linea of fs.readFileSync(ruta, "utf8").split(/\r?\n/)) {
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith("#")) continue;
    const eq = limpia.indexOf("=");
    if (eq < 1) continue;
    salida[limpia.slice(0, eq).trim()] = limpia.slice(eq + 1).trim();
  }
  return salida;
}

function args() {
  const a = {};
  for (let i = 2; i < process.argv.length; i++) {
    const t = process.argv[i];
    if (!t.startsWith("--")) continue;
    const clave = t.slice(2);
    const sig = process.argv[i + 1];
    if (!sig || sig.startsWith("--")) a[clave] = true;
    else {
      a[clave] = sig;
      i++;
    }
  }
  return a;
}

const env = { ...leerEnv(path.join(RAIZ, ".env.local")), ...process.env };
const op = args();
const url = typeof op.url === "string" ? op.url : null;
if (!url) {
  console.error("Uso: --url <url-publica> [--cliente <uuid>] [--precio 9.00]");
  process.exit(1);
}

const client = new Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();

await client.query(
  `insert into modules (id, slug, nombre, descripcion, precio, periodicidad, disponible, url, componentes)
   values ($1,$2,$3,$4,$5,$6,true,$7,$8)
   on conflict (id) do update set
     nombre = excluded.nombre,
     descripcion = excluded.descripcion,
     url = excluded.url,
     disponible = true,
     componentes = excluded.componentes`,
  [
    "mini-shop",
    "mini-shop",
    "Mini Shop",
    "Tu tienda online: catálogo, carrito, pedidos y pagos por transferencia o MercadoPago.",
    op.precio ? Number(op.precio) : 0,
    "mensual",
    url,
    ["tienda"],
  ]
);
console.log(`✓ módulo "mini-shop" registrado (url: ${url})`);

if (typeof op.cliente === "string") {
  await client.query(
    `insert into suscripciones (client_id, module_id, estado, inicia_en, termina_en)
     values ($1, 'mini-shop', 'prueba', current_date, null)
     on conflict (client_id, module_id) do update set estado = 'prueba'`,
    [op.cliente]
  );
  const { rows } = await client.query("select tiene_modulo($1, 'mini-shop') as ok", [op.cliente]);
  console.log(`✓ suscripción para ${op.cliente}  ·  tiene_modulo = ${rows[0].ok}`);
}

await client.end();
