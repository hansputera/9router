# Docker

Run 9Router in a container. Published images: [`hansputera/9router-fork`](https://hub.docker.com/r/hansputera/9router-fork) — multi-platform `linux/amd64` + `linux/arm64`.

**Two variants available:**

| Image tag | Runtime | Base image | SQLite driver | Notes |
|-----------|---------|------------|---------------|-------|
| `:latest` / `:node-latest` | Node.js 22 | `node:22-alpine` | `better-sqlite3` | Default, production-proven |
| `:bun-latest` | Bun 1 | `oven/bun:1-alpine` | `bun:sqlite` (native) | Faster startup + auth + HTTP |

---

# For Users

## Quick start

**Node variant (default):**
```bash
docker run -d \
  -p 20128:20128 \
  -v "$HOME/.9router:/app/data" \
  -e DATA_DIR=/app/data \
  --name 9router \
  hansputera/9router-fork:latest
```

**Bun variant (faster):**
```bash
docker run -d \
  -p 20128:20128 \
  -v "$HOME/.9router:/app/data" \
  -e DATA_DIR=/app/data \
  --name 9router \
  hansputera/9router-fork:bun-latest
```

App listens on port `20128`. Open: http://localhost:20128

## docker compose

### Prerequisites

Create a `.env` file in the same directory as `docker-compose.yml`:

```bash
cp .env.example .env
```

Required minimum env vars:

```ini
JWT_SECRET=change-me-to-a-long-random-secret
INITIAL_PASSWORD=change-me
```

### Start 9Router

**Node variant (default):**
```bash
docker compose up -d
# Open http://localhost:20128
```

**Bun variant (faster):**
```bash
docker compose --profile bun up -d 9router-bun
# Open http://localhost:20128
```

### View logs

```bash
# All services
docker compose logs -f

# 9Router only
docker compose logs -f 9router-node

# Headroom only
docker compose logs -f headroom
```

### Stop and remove

```bash
docker compose down
# Add -v to also delete volumes (removes all data):
docker compose down -v
```

### Update

```bash
docker compose pull
docker compose up -d
```

### Environment variables reference

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | (auto-generated) | Secret for dashboard session cookies |
| `INITIAL_PASSWORD` | `123456` | Default admin password |
| `DATA_DIR` | `/app/data` | Data directory (mounted volume) |
| `PORT` | `20128` | HTTP listen port |
| `HOSTNAME` | `0.0.0.0` | Bind address |
| `NODE_ENV` | `production` | Runtime environment |
| `API_KEY_SECRET` | (auto-generated) | HMAC secret for API keys |
| `MACHINE_ID_SALT` | (auto-generated) | Salt for machine ID |
| `ENABLE_REQUEST_LOGS` | `false` | Enable request body logging |
| `HEADROOM_URL` | (none) | Headroom sidecar URL |
| `HTTP_PROXY` / `HTTPS_PROXY` | (none) | Outbound proxy for upstream calls |

### Custom instance name & logo

Add to your `.env`:

```ini
INSTANCE_NAME=My Team Gateway
INSTANCE_LOGO_URL=https://example.com/logo.png
```

Then run `docker compose up -d` to apply.

### Use with Headroom sidecar

Edit `.env` and add:

```ini
HEADROOM_URL=http://headroom:8787
```

Then start both services:

```bash
docker compose up -d
```

In the dashboard, open **Endpoint** → **Token Saver** → **Headroom**, confirm the URL, recheck status, then enable Headroom.

### Use without Headroom

To run 9Router standalone without the Headroom sidecar:

```bash
docker compose run -d --profile node 9router-node
# Or for Bun:
docker compose run -d --profile bun 9router-bun
```

Or comment out the `depends_on: headroom` line and headroom service from the yml.

### Production checklist

- [ ] Set a strong `JWT_SECRET` in `.env`
- [ ] Change `INITIAL_PASSWORD` from the default
- [ ] Set `API_KEY_SECRET` to a long random value
- [ ] Set `MACHINE_ID_SALT` to a unique value
- [ ] Use a bind mount to persist data (already configured)
- [ ] Run behind a reverse proxy for TLS termination (optional)
- [ ] Restrict port `20128` to internal network if not exposing publicly

---

# For Developers

## Build locally

```bash
# Node variant
docker build --build-arg RUNTIME=node -t 9router .
docker run --rm -p 20128:20128 -v "$HOME/.9router:/app/data" -e DATA_DIR=/app/data 9router

# Bun variant
docker build --build-arg RUNTIME=bun -t 9router-bun .
docker run --rm -p 20128:20128 -v "$HOME/.9router:/app/data" -e DATA_DIR=/app/data 9router-bun
```

## Build both variants with Docker Bake

```bash
docker buildx bake --load      # build both locally
docker buildx bake --push      # push both to registries
```

## Publish (automatic via CI)

Push a git tag `v*` → GitHub Actions builds multi-platform (amd64+arm64) Node + Bun images and pushes to:
- Docker Hub: `hansputera/9router-fork:{tag}`, `hansputera/9router-fork:node-{tag}`, `hansputera/9router-fork:bun-{tag}`
- GHCR: `ghcr.io/hansputera/9router-fork:{tag}`, etc.

```bash
# Use scripts/release.js (recommended)
node scripts/release.js "Release title" "Notes"

# Or manually
git tag v0.5.x && git push origin v0.5.x
```

Workflow: `.github/workflows/docker-publish.yml`

## CI required secrets

| Secret | Purpose |
|--------|---------|
| `DOCKER_USERNAME` | Docker Hub login |
| `DOCKER_PASSWORD` | Docker Hub token |
| `GITHUB_TOKEN` | GHCR login (auto-provided) |
