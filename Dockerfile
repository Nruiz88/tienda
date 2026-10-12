# Coolify / Docker para Next.js 16 (standalone)
#
# Mismo esquema que `D:\webs\inventario` y `D:\webs\wweb`: dos servicios
# con el mismo Dockerfile se comportan igual cuando algo falla.

FROM node:22-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# El lock primero: así un cambio en un `.tsx` no reinstala node_modules.
# ⚠️  Sin package-lock.json, `npm ci` falla a los tres minutos y con un
# error que no dice "falta el lock".
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ⚠️  LAS VARIABLES NEXT_PUBLIC_* SE HORNEAN EN EL BUNDLE
# ------------------------------------------------------
# `NEXT_PUBLIC_PANEL_URL` se sustituye al compilar y queda DENTRO del
# JavaScript que baja el navegador. Como `.env*` está en el
# `.dockerignore`, hay que pasarla como BUILD ARG desde Coolify
# (Build Variables). Si se cambia después, hay que reconstruir: el
# contenedor nuevo serviría el bundle viejo, sin ningún error.
ARG NEXT_PUBLIC_PANEL_URL
ARG NEXT_PUBLIC_MODO_DISENO
ENV NEXT_PUBLIC_PANEL_URL=$NEXT_PUBLIC_PANEL_URL
ENV NEXT_PUBLIC_MODO_DISENO=$NEXT_PUBLIC_MODO_DISENO

RUN npm run build

FROM base AS runner
WORKDIR /app

# ⚠️  wget ES OBLIGATORIO: Alpine no trae curl ni wget, y Coolify pregunta
# por la salud del contenedor con uno de los dos. Sin esto: diez intentos
# "unhealthy" y rollback, con la app perfecta.
RUN apk add --no-cache wget

ENV NODE_ENV=production
ENV PORT=3000
# ⚠️  HOSTNAME: sin esto Next escucha en loopback dentro del contenedor y
# nadie de afuera lo alcanza.
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
