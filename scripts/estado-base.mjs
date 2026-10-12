#!/usr/bin/env node
/* Estado de la base: qué migraciones están aplicadas, qué tablas `shop_*`
   existen y si el bucket de Storage está creado. */

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

const env = { ...leerEnv(path.join(RAIZ, ".env.local")), ...process.env };
const client = new Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();

const tablas = await client.query(
  "select table_name from information_schema.tables where table_schema='public' and table_name like 'shop\\_%' order by 1"
);
console.log("Tablas shop_*:");
for (const r of tablas.rows) console.log("  ✓ " + r.table_name);
if (tablas.rows.length === 0) console.log("  (ninguna)");

const funciones = await client.query(
  "select routine_name from information_schema.routines where routine_schema='public' and routine_name like 'shop\\_%' order by 1"
);
console.log("Funciones shop_*:");
for (const r of funciones.rows) console.log("  ✓ " + r.routine_name);

try {
  const bucket = await client.query("select id, public from storage.buckets where id='shop'");
  console.log("Bucket de Storage:");
  console.log(bucket.rows.length ? `  ✓ shop (público=${bucket.rows[0].public})` : "  ✗ no existe");
} catch {
  console.log("Bucket de Storage: (no se pudo consultar storage.buckets)");
}

await client.end();
