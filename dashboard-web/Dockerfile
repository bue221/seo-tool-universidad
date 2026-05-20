# syntax=docker/dockerfile:1.7

# =============================================================================
# dashboard-web — Next.js 15 + standalone output
# Multi-stage: deps → builder → runner (imagen final ~150MB)
# =============================================================================

# --- Stage 1: deps ----------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
# libc6-compat: requerido por algunos binarios nativos en Alpine (sharp, etc.)
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci

# --- Stage 2: builder -------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Las NEXT_PUBLIC_* se embeben en el bundle aquí. Si necesitas valores
# distintos por entorno, pásalos con --build-arg o reconstruye la imagen.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- Stage 3: runner --------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Usuario no-root para principio de menor privilegio
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copia el bundle standalone, los assets estáticos y public/
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

# server.js es el entrypoint que genera output:'standalone'
CMD ["node", "server.js"]
