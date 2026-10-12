#!/usr/bin/env node
/* =========================================================
   Ticket de desarrollo
   ---------------------------------------------------------
   Firma un ticket como lo hace el panel, para probar el canje sin abrir
   el navegador. NO se usa en producción: en producción lo firma el panel.

   Uso:
     node scripts/dev-ticket.mjs --cliente <uuid> [--uid <uuid>] [--minutos 60]

   Busca un usuario del cliente (profiles) y firma:
     { uid, cid, rol, sid, at, exp, jti }  +  HMAC-SHA256 (SERVICE_SECRET)
   Imprime la URL para abrir en el navegador: <APP_URL>/entrar#ticket=...
   ========================================================= */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
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

const b64url = (s) => Buffer.from(s).toString("base64url");
const env = { ...leerEnv(path.join(RAIZ, ".env.local")), ...process.env };
const op = args();

if (!env.SERVICE_SECRET) {
  console.error("✗ falta SERVICE_SECRET en .env.local");
  process.exit(1);
}

let uid = typeof op.uid === "string" ? op.uid : null;
const cid = typeof op.cliente === "string" ? op.cliente : null;
if (!cid) {
  console.error("Uso: --cliente <uuid> [--uid <uuid>] [--minutos 60]");
  process.exit(1);
}

if (!uid) {
  const client = new Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const { rows } = await client.query(
    "select id from profiles where client_id = $1 and rol = 'client' and activo order by id limit 1",
    [cid]
  );
  if (rows.length) uid = rows[0].id;
  else {
    const alt = await client.query("select id from auth.users order by created_at limit 1");
    uid = alt.rows[0]?.id;
  }
  await client.end();
  if (!uid) {
    console.error("✗ no encontré un usuario. Pasá --uid <uuid>");
    process.exit(1);
  }
}

const minutos = Number(op.minutos) > 0 ? Number(op.minutos) : 60;
const exp = Math.floor(Date.now() / 1000) + minutos * 60;
const payload = {
  uid,
  cid,
  rol: "client",
  sid: null,
  at: "dev.ticket.no.es.token.real",
  exp,
  jti: crypto.randomBytes(9).toString("base64url"),
};

const cuerpo = b64url(JSON.stringify(payload));
const firma = crypto.createHmac("sha256", env.SERVICE_SECRET).update(cuerpo).digest("base64url");
const ticket = `${cuerpo}.${firma}`;

const app = (env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
console.log("Ticket firmado (uid " + uid + ", cid " + cid + ", expira en " + minutos + " min):");
console.log("  " + ticket);
console.log("\nAbrir en el navegador (el ticket va en el #, no en la query):");
console.log("  " + app + "/entrar#ticket=" + ticket);
console.log("\nO canjearlo por API:");
console.log('  curl -s -X POST ' + app + '/api/entrar -H "Content-Type: application/json" -d \'{"ticket":"<ticket>"}\'');
