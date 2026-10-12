# Mini Shop — microservicio multi-cliente

Una tienda online mínima para colgar de la plataforma como módulo: catálogo
con variantes, carrito, checkout, storefront público y admin de pedidos.

Nace de `D:\webs\plantilla-servicio`: **la capa de acceso es la de la
plantilla, sin tocar**. Lo único que cambió de nombres:

| Pieza | Valor en este servicio |
|---|---|
| `MODULO_ID` (`src/lib/acceso/sesion.ts`) | `mini-shop` |
| Tabla de sesiones | `shop_sesiones` (`db/001_sesiones.sql`) |
| Cookie de sesión | `mi_shop` |

---

## Verlo ahora (sin login)

Está en **modo diseño**: abre y navega sin ticket, sin sesión y sin
Supabase, con datos de demostración.

```bash
npm install
npm run dev
```

| Pantalla | URL |
|---|---|
| Admin · Resumen | http://localhost:3000/ |
| Admin · Productos | http://localhost:3000/productos |
| Admin · Pedidos | http://localhost:3000/pedidos |
| Tienda pública | http://localhost:3000/tienda/demo |
| Ficha de producto | http://localhost:3000/tienda/demo/p/cafe-molido |
| Carrito | http://localhost:3000/tienda/demo/carrito |
| Checkout | http://localhost:3000/tienda/demo/checkout |

El **modo diseño** vive en `src/lib/modo.ts`:

- sin la variable → encendido **solo en desarrollo**;
- `NEXT_PUBLIC_MODO_DISENO=1` → encendido aunque sea producción (solo para
  previews);
- `NEXT_PUBLIC_MODO_DISENO=0` → apagado: vuelve a exigir el ticket real.

⚠️ **No dejar el modo diseño encendido en producción**: con él, `proxy.ts`
deja pasar a cualquiera.

## Qué está probado y qué no

- `npm run build` compila en verde (Next 16 + React 19 + Tailwind 4).
- Las 7 pantallas responden 200 y renderizan los datos de demo.
- `POST /api/pedido` crea un pedido y calcula el total.
- **NO probado contra base real**: los datos salen de `src/lib/shop/demo.ts`.
  El camino a Supabase (`src/lib/shop/catalogo.ts`) está escrito pero sin
  ejecutar. El SQL con RLS hay que probarlo aplicándolo y consultando, como
  avisa `db/001_sesiones.sql`.

---

## Estructura

```
db/
  001_sesiones.sql     Sesiones del servicio (de la plantilla).
  002_tienda.sql       Tienda + productos + variantes + RLS.
  003_pedidos.sql      Pedidos + líneas + RLS.
  004_storefront.sql   Lectura pública (anon) + RPC shop_crear_pedido().
src/lib/acceso/        Conexión con el panel. NO se toca.
src/lib/modo.ts        El interruptor de modo diseño.
src/lib/shop/          Dominio: tipos, demo, acceso a datos, estados.
src/components/        UI (ui/ base, admin/, tienda/, carrito/).
src/app/(admin)/       Pantallas del dueño de la tienda.
src/app/tienda/[slug]/ Storefront público.
src/app/api/pedido/    Alta de pedido desde el checkout.
```

## Cómo funciona el storefront (lo que decide el diseño)

El comprador es **anónimo**: no tiene ticket ni cuenta.

- **Lectura**: el catálogo es público. En `src/proxy.ts` la ruta `/tienda`
  está en `PUBLICAS`. Las políticas de la 004 dejan a `anon` leer solo
  tiendas y productos **activos**.
- **Escritura**: el pedido entra por `shop_crear_pedido` (`security definer`),
  que **vuelve a leer el precio y el stock de la base**. El navegador manda
  una intención (variante + cantidad), nunca el precio. Descuenta stock y
  escribe pedido + líneas en una sola transacción.
- **Admin**: el dueño entra por el ticket, y sus consultas van con RLS por
  `client_id`.

## Para pasarlo a producción (lo que falta)

1. **Registrar el módulo** `mini-shop` en la tabla `modules` del panel y
   poner su URL (ver `COOLIFY.md`).
2. Aplicar las migraciones `001`→`004` con el `DATABASE_URL` del panel.
3. **Probar las RLS contra la base** (un script de consultas), no solo que
   compile.
4. Apagar el modo diseño (`NEXT_PUBLIC_MODO_DISENO=0`) y **abrir el enlace
   desde el panel en un navegador de verdad**.
5. Al conectar el camino real, mover las escrituras del admin de
   `getAdmin()` a `getScoped()`.

## La decisión de fondo: tenancy compartido

Muchos clientes → **una sola base con RLS por `client_id`**, no una base por
cliente. Añadir un cliente es una fila, no una migración. Por eso los
índices llevan `client_id` primero: las políticas RLS lo añaden a cada
consulta. Ver `db/002_tienda.sql`.
