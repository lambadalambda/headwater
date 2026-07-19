# syntax=docker/dockerfile:1.7

FROM node:24-bookworm-slim@sha256:6f7b03f7c2c8e2e784dcf9295400527b9b1270fd37b7e9a7285cf83b6951452d AS build

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
WORKDIR /src

RUN corepack enable && corepack prepare pnpm@11.5.2 --activate

COPY daemon/package.json daemon/pnpm-lock.yaml daemon/pnpm-workspace.yaml daemon/
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml frontend/
RUN pnpm --dir daemon install --frozen-lockfile \
    && pnpm --dir frontend install --frozen-lockfile

COPY daemon/ daemon/
COPY frontend/ frontend/
RUN pnpm --dir frontend build \
    && pnpm --dir daemon build \
    && pnpm --dir daemon prune --prod

FROM node:24-bookworm-slim@sha256:6f7b03f7c2c8e2e784dcf9295400527b9b1270fd37b7e9a7285cf83b6951452d AS runtime

LABEL org.opencontainers.image.title="Headwater" \
      org.opencontainers.image.description="Single-user social networking over encrypted email" \
      org.opencontainers.image.source="https://github.com/lambadalambda/headwater" \
      org.opencontainers.image.licenses="Unlicense"

WORKDIR /app
COPY --from=build --chown=node:node /src/daemon/dist daemon/dist
COPY --from=build --chown=node:node /src/daemon/node_modules daemon/node_modules
COPY --from=build --chown=node:node /src/daemon/package.json daemon/package.json
COPY --from=build --chown=node:node /src/frontend/build frontend/build
COPY --chown=node:node LICENSE /usr/share/licenses/headwater/LICENSE
RUN install -d -o node -g node /data

ENV NODE_ENV=production \
    PORT=4030 \
    HEADWATER_HOSTNAME=0.0.0.0 \
    HEADWATER_ALLOW_NON_LOOPBACK=1 \
    HEADWATER_BASE_URL=http://localhost:4030 \
    HEADWATER_ACCOUNT=main \
    HEADWATER_DATA=/data/main \
    HEADWATER_ACCOUNTS=/data/accounts.local.json \
    HEADWATER_AUTH=/data/main.auth.json \
    HEADWATER_STATIC=/app/frontend/build

VOLUME ["/data"]
EXPOSE 4030
USER node

HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=6 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||'4030')+'/api/headwater/status').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "daemon/dist/main.js"]
