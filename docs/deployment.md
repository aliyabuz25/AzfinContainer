# Deployment checklist for AZFIN stack

This repository is built for environments where Traefik, Portainer, and an external `edge` network already exist. Follow these steps before deploying the stack so that each service (especially `azfin2`) can start healthy.

## 1. Preflight

- Confirm you are on the target host, that you can read/write `/datastore`, and that Docker/Traefik/Portainer are installed.
- Run `./scripts/preflight.sh` from the repo root to check:
  - `docker compose` is available.
  - `/datastore` and the expected subdirectories (`mysql`, `uploads`, `nginx-logs`) exist or are created.
  - the external `edge` network exists (`docker network inspect edge`). The stack depends on this network for Traefik routing; if it’s missing, create it (`docker network create edge`).
- Keep the Traefik entrypoint `web` and host binding `127.0.0.1:8080` as configured in this project.

## 2. Archive placement

- Store the `AZFIN` archive at `/datastore/<app>/<app>.zip`.
- Extract it into `/datastore/<app>/app` so Portainer can build from `/datastore/<app>/app`.
- Ensure `/datastore/<app>/uploads` and `/datastore/<app>/nginx-logs` exist for persistence.

## 3. Code expectations

- Any frontend references to `http://localhost` must be rewritten as relative paths such as `/api/`.
- Backend upload URLs must return relative paths (`/uploads/<file>`). Use `PUBLIC_BASE_URL` as needed to override the prefix.

## 4. Dockerfiles

- If you build images manually from the archive, use minimal Dockerfiles:

```Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
EXPOSE 3001
ENV HOST=0.0.0.0
CMD ["node", "server.js"]
```

```Dockerfile
FROM nginx:alpine
RUN mkdir -p /app/nginx-logs
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 901
```

## 5. Building outside Portainer

- If Portainer cannot reach `/datastore`, build the images on the host:
  ```bash
  docker build -t azfin-backend:latest -f /datastore/<app>/app/Dockerfile.backend /datastore/<app>/app
  docker build -t azfin-frontend:latest -f /datastore/<app>/app/Dockerfile.frontend /datastore/<app>/app
  ```

## 6. Portainer Stack template

Use this stack template responsibly. The backend is designed to start in degraded mode and keep retrying MySQL in the background, so the stack should still deploy even if the database is slow to become healthy.

```yaml
services:
  db:
    image: mysql:8.0
    restart: unless-stopped
    entrypoint:
      - sh
      - -lc
      - |
          set -e
          if [ -d /var/lib/mysql/mysql ] || [ -f /var/lib/mysql/ibdata1 ]; then
            exec docker-entrypoint.sh mysqld
          fi
          mkdir -p /var/lib/mysql/data
          chown -R mysql:mysql /var/lib/mysql/data
          exec docker-entrypoint.sh mysqld --datadir=/var/lib/mysql/data
    environment:
      MYSQL_DATABASE: azfin_db
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_USER: azfin_user
      MYSQL_PASSWORD: azfin_password
    volumes:
      - /datastore/<app>/mysql:/var/lib/mysql
    healthcheck:
      test: ["CMD-SHELL", "mysqladmin ping -h 127.0.0.1 --silent || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 36
      start_period: 120s
    networks:
      - edge

  azfin-backend:
    image: azfin-backend:latest
    restart: unless-stopped
    depends_on:
      - db
    environment:
      PORT: "3001"
      DB_HOST: db
      DB_USER: azfin_user
      DB_PASSWORD: azfin_password
      DB_NAME: azfin_db
    volumes:
      - /datastore/<app>/uploads:/app/uploads
    networks:
      - edge
    labels:
      - 'traefik.enable=true'
      - 'traefik.docker.network=edge'
      - 'traefik.http.routers.azfin-api.rule=(Host(`azfin.az`) || Host(`azfin.octotech.az`)) && (PathPrefix(`/api`) || PathPrefix(`/uploads`))'
      - 'traefik.http.routers.azfin-api.entrypoints=web'
      - 'traefik.http.routers.azfin-api.priority=100'
      - 'traefik.http.services.azfin-api.loadbalancer.server.port=3001'

  azfin-frontend:
    image: azfin-frontend:latest
    restart: unless-stopped
    networks:
      - edge
    labels:
      - 'traefik.enable=true'
      - 'traefik.docker.network=edge'
      - 'traefik.http.routers.azfin.rule=Host(`azfin.az`) || Host(`azfin.octotech.az`)'
      - 'traefik.http.routers.azfin.entrypoints=web'
      - 'traefik.http.services.azfin.loadbalancer.server.port=901'

networks:
  edge:
    external: true
```

*Avoid publishing host ports; Traefik handles routing over `edge`. Keep label parentheses, especially around multi-part router rules.*

## 7. Cloudflared / DNS

- Point each Cloudflare tunnel’s Public Hostname at `http://127.0.0.1:8080`.
- Missing DNS for any domain shows `ERR_NAME_NOT_RESOLVED`.

## 8. Smoke checks

```bash
curl -H "Host: azfin.az" http://127.0.0.1:8080/
docker ps | grep azfin
```

## 9. Gotchas

- Always enclose Traefik rules in parentheses for correct operator precedence.
- Quote long labels with single quotes in YAML.
- Keep API paths in the router rule in sync (`/api`, `/uploads`, and any new prefixes such as `/cdn`).
- Remove macOS metadata directories (`__MACOSX`, `._*`) before bundling the ZIP.
- MySQL environment variables are only applied on first initialization of the data directory. If you reuse an old `/var/lib/mysql`, changed passwords will not be rewritten into that volume.
- `azfin-backend` no longer waits for `db` to become `healthy` during stack startup. This avoids Portainer aborting the whole deploy when MySQL is merely slow; the backend keeps retrying the DB connection on its own.
- The MySQL container now auto-falls back to `/var/lib/mysql/data` when the mount root contains stray files but not a valid MySQL datadir. This avoids the repeated `--initialize specified but the data directory has files in it` crash loop.
