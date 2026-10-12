#!/usr/bin/env node
/* =========================================================
   Alta de tienda por línea de comandos
   ---------------------------------------------------------
   Para provisionar una tienda sin esperar a que el cliente entre al
   admin. También sirve para probar el storefront real.

   Uso:
     node scripts/alta-tienda.mjs --listar
     node scripts/alta-tienda.mjs --cliente <uuid> --slug nordes --nombre "Nordés" [--ejemplo]
     node scripts/alta-tienda.mjs --borrar <slug>

   `--ejemplo` carga 6 productos de ropa para que la tienda no arranque
   vacía.
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
    if (t.startsWith("--")) {
      const clave = t.slice(2);
      const siguiente = process.argv[i + 1];
      if (!siguiente || siguiente.startsWith("--")) a[clave] = true;
      else {
        a[clave] = siguiente;
        i++;
      }
    }
  }
  return a;
}

const slugificar = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const SEMILLA = [
  { nombre: "Camisa de lino", categoria: "Hombre", imagen: "👔", precio: 58000, stock: 8 },
  { nombre: "Remera de algodón", categoria: "Hombre", imagen: "👕", precio: 24000, stock: 20 },
  { nombre: "Vestido midi", categoria: "Mujer", imagen: "👗", precio: 72000, stock: 6 },
  { nombre: "Sweater de lana", categoria: "Mujer", imagen: "🧶", precio: 46000, stock: 9 },
  { nombre: "Zapatillas de lona", categoria: "Calzado", imagen: "👟", precio: 89000, stock: 12 },
  { nombre: "Gorra de sarga", categoria: "Accesorios", imagen: "🧢", precio: 18000, stock: 25 },
];

const env = { ...leerEnv(path.join(RAIZ, ".env.local")), ...process.env };
if (!env.DATABASE_URL) {
  console.error("✗ falta DATABASE_URL en .env.local");
  process.exit(1);
}

const op = args();
const client = new Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();

/* ── Listar clientes ── */
if (op.listar) {
  const cols = await client.query(
    "select column_name from information_schema.columns where table_schema='public' and table_name='clients'"
  );
  const nombres = cols.rows.map((r) => r.column_name);
  const etiqueta = ["nombre", "name", "razon_social", "empresa", "titulo"].find((c) => nombres.includes(c));
  const q = `select id${etiqueta ? ", " + etiqueta + " as etiqueta" : ""} from public.clients order by id limit 30`;
  const { rows } = await client.query(q);
  console.log("Clientes (id  ·  etiqueta):");
  for (const r of rows) console.log("  " + r.id + "  ·  " + (r.etiqueta ?? "(sin nombre)"));
  await client.end();
  process.exit(0);
}

/* ── Borrar tienda ── */
if (op.borrar) {
  const slug = String(op.borrar);
  const { rowCount } = await client.query("delete from shop_tiendas where slug=$1", [slug]);
  console.log(rowCount ? `✓ tienda "${slug}" borrada` : `· no existía "${slug}"`);
  await client.end();
  process.exit(0);
}

/* ── Crear tienda ── */
const clienteId = op.cliente;
const nombre = typeof op.nombre === "string" ? op.nombre : null;
if (!clienteId || !nombre) {
  console.error("Uso: --cliente <uuid> --nombre \"Mi Tienda\" [--slug mi-tienda] [--ejemplo]");
  process.exit(1);
}

const slug = slugificar(op.slug || nombre);
const { rows: existentes } = await client.query("select id from shop_tiendas where client_id=$1", [clienteId]);
if (existentes.length) {
  console.error("✗ ese cliente ya tiene una tienda");
  await client.end();
  process.exit(1);
}

let slugFinal = slug;
const { rows: choque } = await client.query("select id from shop_tiendas where slug=$1", [slugFinal]);
if (choque.length) slugFinal = `${slug}-${Math.random().toString(36).slice(2, 5)}`;

const { rows: tienda } = await client.query(
  "insert into shop_tiendas (client_id, slug, nombre, activo) values ($1,$2,$3,true) returning id",
  [clienteId, slugFinal, nombre]
);
console.log(`✓ tienda creada: ${nombre}  (/tienda/${slugFinal})`);

if (op.ejemplo) {
  for (const p of SEMILLA) {
    const { rows: prod } = await client.query(
      "insert into shop_productos (tienda_id, client_id, slug, nombre, categoria, imagen, activo) values ($1,$2,$3,$4,$5,$6,true) returning id",
      [tienda[0].id, clienteId, `${slugificar(p.nombre)}-${Math.random().toString(36).slice(2, 5)}`, p.nombre, p.categoria, p.imagen]
    );
    await client.query(
      "insert into shop_variantes (producto_id, tienda_id, client_id, nombre, precio_centavos, stock) values ($1,$2,$3,$4,$5,$6)",
      [prod[0].id, tienda[0].id, clienteId, "Único", p.precio * 100, p.stock]
    );
  }
  console.log(`✓ ${SEMILLA.length} productos de ejemplo cargados`);
}

await client.end();
