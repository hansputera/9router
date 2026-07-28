# syntax=docker/dockerfile:1.7
# Multi-runtime Dockerfile: build with --build-arg RUNTIME=node|bun
ARG RUNTIME=node

# ─── Base images ──────────────────────────────────────────────────────────
FROM node:22-alpine AS node-base
RUN apk --no-cache upgrade && apk --no-cache add python3 make g++ linux-headers

FROM oven/bun:1-alpine AS bun-base
RUN apk --no-cache upgrade

# ─── Builder ──────────────────────────────────────────────────────────────
FROM ${RUNTIME}-base AS builder
ARG RUNTIME
WORKDIR /app

COPY package.json ./
RUN if [ "$RUNTIME" = "node" ]; then \
      npm install --no-audit --no-fund; \
    else \
      bun install; \
    fi

COPY . ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN if [ "$RUNTIME" = "node" ]; then \
      npm run build:node; \
    else \
      bun run build; \
    fi

# ─── Runner ───────────────────────────────────────────────────────────────
FROM ${RUNTIME}-base AS runner
ARG RUNTIME
WORKDIR /app

LABEL org.opencontainers.image.title="9router"
LABEL org.opencontainers.image.description="9Router — local AI routing gateway"
LABEL org.opencontainers.image.variant=${RUNTIME}

ENV NODE_ENV=production
ENV PORT=20128
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATA_DIR=/app/data

# Copy standalone output
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/custom-server.js ./custom-server.js
COPY --from=builder /app/open-sse ./open-sse

# MITM and runtime deps
COPY --from=builder /app/src/mitm ./src/mitm
COPY --from=builder /app/node_modules/node-forge ./node_modules/node-forge
COPY --from=builder /app/node_modules/next ./node_modules/next

RUN mkdir -p /app/data && \
    ln -sf /app/data /root/.9router 2>/dev/null || true

# Runtime-agnostic launcher — picks bun or node
RUN printf '#!/bin/sh\nif command -v bun >/dev/null 2>&1; then exec bun custom-server.js; else exec node custom-server.js; fi\n' > /launcher.sh && \
    chmod +x /launcher.sh

EXPOSE 20128

CMD ["/launcher.sh"]
