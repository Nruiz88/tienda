# Desplegar un microservicio nuevo

Esto no es la guía de "cómo se despliega". Es la lista de **los fallos que pasaron de verdad**, para no repetirlos.

---

## 1. La tabla de sesiones necesita RLS sin políticas

La migración `db/001_sesiones.sql` la crea. Si te olvidas de la línea:

```sql
alter table servicio_sesiones enable row level security;
```

entonces `authenticated` puede leer **todas** las sesiones del sistema, y con eso los tokens. Con RLS encendido y **sin políticas**, la tabla es invisible para el navegador y solo la alcanza la secret key.

---

## 2. ⚠️ En Coolify: `is_preview` tiene que ser FALSE

**Este es el que más rato costó.**

Las variables de entorno que se crean por la API de Coolify vienen marcadas `is_preview: true`, lo que significa *solo para despliegues de preview*. En un despliegue normal **no llegan al contenedor**.

El síntoma: el servicio arranca y dice

```
[db] falta SUPABASE_URL o SUPABASE_SECRET_KEY
```

y en Coolify, en la lista, están todas puestas.

Lo que hay que hacer: marcar `is_preview = false` en cada una. O desde la interfaz, que el interruptor se llame algo como "Available at Preview" y deba estar apagado.

Cómo comprobarlo, que es lo que de verdad sirve:

```bash
# dentro del contenedor
docker exec <contenedor> env | grep SUPABASE
```

Si no salen, es esto.

---

## 3. Dos clientes de Supabase, y no uno

- `SUPABASE_SECRET_KEY` para el servidor. Salta RLS.
- `SUPABASE_PUBLISHABLE_KEY` para el cliente con token de usuario. Aplica RLS.

Se confunden porque las dos se llaman "la clave de Supabase". Si las pones cambiadas, la app funciona en local (donde el error es el mismo) y en producción se rompe de formas distintas según qué ruta se ejecutó.

La de RLS empieza por `sb_secret_`; la de usuario es más corta y empieza por `sb_publishable_`.

---

## 4. `SERVICE_SECRET` tiene que ser IGUAL al del panel

Y distinto de `SESSION_SECRET`.

Si no coinciden, el canje devuelve 401 con "ese enlace no vale", que no dice nada de por qué. **Lo primero que hay que mirar si da 401 es si los dos secretos tienen la misma longitud.** Esa comparación la resuelve el fallo en un minuto.

---

## 5. La cookie en producción necesita `secure`

```ts
secure: process.env.NODE_ENV === "production"
```

Sin esto, detrás de un proxy HTTPS el navegador **descarta la cookie entera** y el servicio parece roto sin decir nada: entra, canjea bien, y a la siguiente página no hay sesión.

Ojo con esto: `request.url` puede decir `http` aunque el navegador venga por `https`, si no se leen las cabeceras del proxy. `secure` se decide con `NODE_ENV`, no con `request.url`.

---

## 6. El `matcher` del proxy, o la app va lentísima

```ts
matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"]
```

El `.*\\..*` saca de la lista todo lo que tiene un punto: los `.js`, `.css`, las imágenes. Sin eso, una página con 40 recursos hace 40 consultas a la tabla de sesiones para comprobar una cookie que no ha cambiado.

No es solo la base: son 40 `await` en el camino crítico de la primera pintura, y en un móvil se nota.

---

## 7. El proxy NO es la seguridad

Solo evita pintar páginas vacías. La seguridad son las políticas de RLS.

Un servicio que se apoya solo en el middleware tiene un fallo de seguridad con toda la pinta de funcionar: con `searchParams.get("id")` sin comprobar, el proxy deja pasar la petición, RLS filtra `bots` pero no tu tabla, y nadie se entera hasta que alguien ve datos ajenos.

**La regla:** el id siempre sale de una función que usa el cliente con RLS. Nunca de la URL.

---

## 8. La firma se comprueba ANTES de deserializar

Si primero haces `JSON.parse` del payload y luego compruebas la firma, alguien puede mandarte un payload arbitrario y lo deserializas antes de comprobar nada.

El orden correcto: cortar por el punto, comprobar la firma, y solo entonces leer el cuerpo.

---

## 9. ⚠️ El `.env.example` NO lleva claves de verdad

Un `.example` con la clave real escrita es una bomba de relojería: el día que alguien lo sube, la clave está en el repositorio para siempre.

En este repositorio ya había uno con claves de producción de verdad (`EVOLUTION_API_KEY`, `WEBHOOK_SECRET`, la URL de MariaDB con contraseña). Estaba ignorado por `.gitignore`, así que no se había filtrado, pero se borró igualmente.

Lo que va en un `.example` es la **forma** de la variable, no su valor.

---

## 10. El test tiene que ejecutar el código que se rompe

El bug más caro que ha habido en este sistema: la entrada al bot **nunca funcionó desde un navegador**, y todas las pruebas daban verde.

La página mandaba el hash con el prefijo `ticket=` pegado. Las pruebas hacían el POST ellas mismas, con el ticket ya limpio, y **no pasaban por esa línea**. El bug no estaba en el servidor, estaba en el navegador, y no había ningún test que lo ejecutara.

Cómo se cubre:

- El parseo del hash va en **su propio fichero** (`hash-ticket.ts`), no dentro del componente. Así se puede probar sin React ni DOM.
- La prueba importa **ese fichero**, no una copia. Una copia se queda vieja el primer día que cambia el original y sigue dando verde.
- Y hay una prueba que **mira el JavaScript publicado** y comprueba que recorta el prefijo. Es frágil a propósito: si el minificador cambia de forma, que falle antes que pasar sin mirar.

---

## El orden, para no perder el día

1. `npm install`
2. Aplicar `db/001_sesiones.sql` (con el `DATABASE_URL` del panel)
3. Poner las variables, con `is_preview = false`
4. Comprobar con `docker exec <contenedor> env`
5. Desplegar
6. Mirar el log del arranque: si dice que falta Supabase, es el punto 2
7. Registrar el módulo en el panel: `modules.url` y la fila para que salga en el portal
8. **Abrir el enlace en un navegador de verdad.** Es el paso que detecta el punto 10 y no lo sustituye ninguna prueba

---

## Comprobar que la conexión está bien

Es lo que hay que mirar cuando algo va mal, en este orden:

| Síntoma | Dónde mirar |
|---|---|
| `[db] falta SUPABASE_URL` | Punto 2. Las variables no llegan al contenedor |
| 401 "ese enlace no vale" | Punto 4. Los secretos no coinciden |
| El canje va bien y luego no hay sesión | Punto 5. Falta `secure` |
| Va lento y el log está lleno de lo mismo | Punto 6 |
| El panel da 503 al entrar | El panel, no este servicio. Mirar su log |
| 401 solo en el navegador, nunca en los tests | Punto 10. Es el fragmento |

---

# Desplegar el MINI SHOP

Los 10 puntos de arriba son de la plantilla y valen igual. Esto es lo
propio de este servicio.

## Variables

**Build variables** (Coolify → Build → Build Variables). Van al bundle:

| Variable | Ejemplo |
|---|---|
| `NEXT_PUBLIC_PANEL_URL` | `https://panel-niconqn.duckdns.org` |
| `NEXT_PUBLIC_MODO_DISENO` | `0` (o no ponerla: en prod es off solo) |

**Runtime variables** (Coolify → Environment). Con `is_preview = false`:

| Variable | Para qué |
|---|---|
| `SUPABASE_URL` | La base (la misma del panel) |
| `SUPABASE_SECRET_KEY` | `sb_secret_…` (servidor) |
| `SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` (RLS) |
| `SERVICE_SECRET` | **IGUAL** que el del panel |
| `APP_URL` | `https://tienda.tudominio.com` (la usa MercadoPago para volver y avisar) |
| `BUSINESS_TIMEZONE` | Opcional |
| `DATABASE_URL` | Solo si vas a correr migraciones desde el contenedor |

## Migraciones

Se corren desde el host (no en el build), con el `DATABASE_URL`:

```bash
npm run migrate        # aplica 001..007
npm run estado         # tablas, funciones y bucket
```

La migración **006** crea el bucket de Storage `shop` (público). Si el
plan de Supabase no permite crearlo por SQL, creálo a mano: **Storage →
New bucket → `shop` → Public**.

## Registrar el módulo en el panel

```bash
npm run modulo -- --url https://tienda.tudominio.com
```

Eso deja `modules.id = 'mini-shop'` y `url`. Sin esto, el panel no puede
firmar tickets para este servicio.

## MercadoPago

La `notification_url` la arma la app sola: `APP_URL/api/webhooks/mercadopago`.
Solo hay que **cargar el access token en Configuración** de cada tienda.
Para probar en serio hace falta un `APP_URL` **público** (MercadoPago no
puede avisar a `localhost`).

## Health check

El `Dockerfile` mete `wget` para que Coolify pueda preguntar por la salud.
Si ves `unhealthy` con la app levantada, es esto.

## Orden, para no perder el día

1. Variables (build + env), con `is_preview = false`.
2. Migraciones (`npm run migrate`).
3. Registrar el módulo (`npm run modulo -- --url …`).
4. Desplegar.
5. Abrir el enlace desde el panel **en un navegador de verdad**.
6. Cargar la tienda (o crearla desde el admin) y cargar el access token de MercadoPago.