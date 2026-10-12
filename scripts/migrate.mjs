#!/usr/bin/env node
/* =========================================================
   Aplicar las migraciones de db/ contra la base
   ---------------------------------------------------------
   Uso:
     node scripts/migrate.mjs            aplica lo que falte
     node scripts/migrate.mjs --estado   solo muestra el estado

   Cada migración va en SU transacción: si una falla, se deshace entera y
   no queda a medias. Lo aplicado se registra en `shop_migraciones`, así
   que correrlo dos veces no repite nada.
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

const env = { ...leerEnv(path.join(RAIZ, ".env.local")), ...process.env };
if (!env.DATABASE_URL) {
  console.error("✗ falta DATABASE_URL en .env.local");
  process.exit(1);
}

const dir = path.join(RAIZ, "db");
const archivos = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
const soloEstado = process.argv.includes("--estado");

const client = new Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
} catch (e) {
  console.error("✗ no se pudo conectar a la base:", e.message);
  process.exit(1);
}

await client.query(`create table if not exists shop_migraciones (
  nombre      text primary key,
  aplicado_en timestamptz not null default now()
);`);

const { rows } = await client.query("select nombre from shop_migraciones");
const aplicadas = new Set(rows.map((r) => r.nombre));

if (soloEstado) {
  console.log("═══ Migraciones ═══\n");
  for (const f of archivos) console.log(`  ${aplicadas.has(f) ? "✓" : "·"} ${f}`);
  await client.end();
  process.exit(0);
}

let aplicadasAhora = 0;
for (const f of archivos) {
  if (aplicadas.has(f)) {
    console.log(`  · ${f} (ya aplicada)`);
    continue;
  }
  const sql = fs.readFileSync(path.join(dir, f), "utf8");
  process.stdout.write(`  → ${f} … `);
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("insert into shop_migraciones (nombre) values ($1)", [f]);
    await client.query("commit");
    console.log("✓");
    aplicadasAhora++;
  } catch (e) {
    await client.query("rollback");
    console.log("✗");
    console.error("    " + e.message);
    await client.end();
    process.exit(1);
  }
}

console.log(aplicadasAhora ? `\n  ${aplicadasAhora} migración(es) aplicadas.` : "\n  Todo al día.");
await client.end();
