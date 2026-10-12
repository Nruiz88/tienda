import nodemailer, { type Transporter } from "nodemailer";
import { aPesos } from "./dinero";
import type { Pedido } from "./shop/tipos";

/* =========================================================
   Correos del pedido
   ---------------------------------------------------------
   Manda dos correos cuando entra un pedido:
     · al COMPRADOR: confirmación con el detalle y cómo pagar.
     · al DUEÑO: aviso del nuevo pedido (si cargó un email).

   Si no hay SMTP configurado, NO es un error: simplemente no se manda.
   El pedido ya quedó registrado, y el correo es un extra.
   ========================================================= */

let cache: Transporter | null | undefined;

function transporte(): Transporter | null {
  if (cache !== undefined) return cache;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) {
    cache = null;
    return null;
  }
  const port = Number(process.env.SMTP_PORT || 587);
  cache = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return cache;
}

function envoltura(titulo: string, cuerpo: string): string {
  return `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#1b1916">
    <h1 style="font-size:20px;margin:0 0 12px">${titulo}</h1>${cuerpo}
    <p style="color:#7b7469;font-size:12px;margin-top:24px">Enviado por Mini Shop.</p>
  </div>`;
}

function tabla(pedido: Pedido): string {
  const filas = pedido.lineas
    .map(
      (l) =>
        `<tr><td style="padding:6px 0">${l.cantidad}× ${l.nombre} <span style="color:#7b7469">(${l.variante})</span></td>` +
        `<td style="text-align:right;padding:6px 0">${aPesos(l.precioCentavos * l.cantidad)}</td></tr>`
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${filas}` +
    `<tr><td style="padding-top:8px;font-weight:700;border-top:1px solid #e2dcd2">Total</td>` +
    `<td style="padding-top:8px;text-align:right;font-weight:700;border-top:1px solid #e2dcd2">${aPesos(pedido.totalCentavos)}</td></tr></table>`;
}

export interface DatosEmail {
  pedido: Pedido;
  tienda: string;
  transferencia?: { titular: string; banco: string; cbu: string; alias: string };
  whatsapp?: string;
  emailDueno?: string;
  esTransferencia?: boolean;
}

export async function enviarEmailsPedido(d: DatosEmail): Promise<void> {
  const t = transporte();
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || "";
  if (!t || !from) return;

  const tareas: Promise<unknown>[] = [];

  if (d.pedido.email) {
    const pago =
      d.esTransferencia && d.transferencia
        ? `<p>Transferí <strong>${aPesos(d.pedido.totalCentavos)}</strong> a:</p><ul>` +
          (d.transferencia.alias ? `<li>Alias: <strong>${d.transferencia.alias}</strong></li>` : "") +
          (d.transferencia.cbu ? `<li>CBU: ${d.transferencia.cbu}</li>` : "") +
          (d.transferencia.titular ? `<li>Titular: ${d.transferencia.titular}</li>` : "") +
          (d.transferencia.banco ? `<li>Banco: ${d.transferencia.banco}</li>` : "") +
          `</ul>` +
          (d.whatsapp
            ? `<p>Enviá el comprobante por WhatsApp: <a href="https://wa.me/${d.whatsapp.replace(/\D/g, "")}">${d.whatsapp}</a></p>`
            : "")
        : `<p>Te contactamos para coordinar el pago y la entrega.</p>`;

    tareas.push(
      t.sendMail({
        from,
        to: d.pedido.email,
        subject: `Pedido #${d.pedido.numero} — ${d.tienda}`,
        html: envoltura(
          `¡Gracias por tu compra, ${d.pedido.cliente}!`,
          `<p>Tu pedido <strong>#${d.pedido.numero}</strong> quedó registrado.</p>${tabla(d.pedido)}${pago}`
        ),
      })
    );
  }

  if (d.emailDueno) {
    tareas.push(
      t.sendMail({
        from,
        to: d.emailDueno,
        subject: `Nuevo pedido #${d.pedido.numero} — ${d.tienda}`,
        html: envoltura(
          `Nuevo pedido #${d.pedido.numero}`,
          `<p><strong>${d.pedido.cliente}</strong> · ${d.pedido.telefono}</p>` +
            `<p>${d.pedido.direccion}</p>${tabla(d.pedido)}`
        ),
      })
    );
  }

  await Promise.allSettled(tareas);
}
