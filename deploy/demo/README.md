# LocalBuddy demo server

A hosted copy of the API for showing the app from a phone: invented people, **fake payments and
fake identity checks**. Not for real users, real money or real personal data. Why it exists and
what it is not: [ADR-0010](../../docs/adr/0010-demo-environment.md).

What runs, from [compose.yaml](compose.yaml):

| Service    | What it does |
|------------|--------------|
| `postgres` | Postgres 16.11, data in the `pgdata` volume, not reachable from outside the network |
| `migrate`  | One-shot: applies the EF migration bundle baked into the image, then exits |
| `api`      | The API with `ASPNETCORE_ENVIRONMENT=Demo`, on `127.0.0.1:${API_PORT}` only, photos in the `photos` volume |

Every `docker compose up` waits for Postgres, runs `migrate` to completion, and only then starts
`api`. An empty database therefore needs no extra step; a failed migration leaves `api` stopped.

## First deploy

Run on the server, as a user that can use Docker. Steps 1 to 3 once; step 4 on every update.

1. Put the repository on the server (a `git clone`, or copy `backend/`, `deploy/`, `global.json`
   and `.dockerignore` keeping the layout: the image is built from the repository root).

2. Create the secrets file next to `compose.yaml`:

   ```bash
   cd deploy/demo
   cp .env.example .env
   sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$(openssl rand -hex 24)|" .env
   sed -i "s|^JWT_KEY=.*|JWT_KEY=$(openssl rand -base64 48)|" .env
   chmod 600 .env
   ```

   Then check `API_PORT` (default 8080) and `DEMO_SUBNET` (default `10.250.250.0/24`) against
   what is already on the server:

   ```bash
   ss -ltn | grep ":8080 "                                  # must print nothing
   docker network inspect $(docker network ls -q) --format '{{.Name}} {{range .IPAM.Config}}{{.Subnet}}{{end}}'
   ```

   `.env` is ignored by git (`deploy/demo/.gitignore`). Never commit it, never paste it in chat.

3. Add the Caddy site. Copy the block from [Caddyfile](Caddyfile) into the server's Caddyfile,
   replace `demo-api.EXAMPLE.TLD` with the real hostname and `8080` with `API_PORT` if you changed
   it. **Stop here** and check that the hostname's DNS record points at the server, then:

   ```bash
   caddy validate --config /etc/caddy/Caddyfile
   sudo systemctl reload caddy     # or: caddy reload --config /etc/caddy/Caddyfile
   ```

4. Build and start:

   ```bash
   docker compose up -d --build
   docker compose ps -a            # migrate: Exited (0); api and postgres: running
   docker compose logs migrate api
   curl -fsS https://demo-api.EXAMPLE.TLD/health    # Healthy
   ```

   If `api` exits at once, its log says why: a missing, short or development `JWT_KEY`, a bad
   `DEMO_SUBNET`, or the database. These are on purpose (fail fast, ADR-0010).

## Seeding the nine demo people

[`backend/scripts/seed-demo.sh`](../../backend/scripts/seed-demo.sh) runs **from your own machine**
(it needs `demo-photos/`, which is not in git). It talks to the API over HTTPS and writes the
credits with `docker exec` into the Postgres container; `DOCKER_HOST=ssh://...` sends that one
command to the server's Docker instead of the local one.

```bash
# On your machine, from the repository root:
API=https://demo-api.EXAMPLE.TLD/api/v1 \
PG=localbuddy-demo-postgres-1 \
DOCKER_HOST=ssh://<user>@<server> \
bash backend/scripts/seed-demo.sh
```

The auth endpoints allow 10 calls a minute per address, so the script pauses on 429 and takes a
few minutes. Re-running it replaces the nine accounts and touches nothing else. Every account is
`<name>@demo.localbuddy.test`, password `DemoPass123!` (public: it is in the script).

## Phone

The APK is built with the `preview` profile in [`mobile/eas.json`](../../mobile/eas.json). Its
`EXPO_PUBLIC_API_URL` is a placeholder: set it to `https://<real demo host>` (no `/api/v1`, the
client adds it) before running `eas build --profile preview --platform android`.

## Updating, stopping, backups

```bash
git pull && docker compose up -d --build     # new image; migrate runs again, idempotent
docker compose down                          # stops everything, KEEPS the pgdata and photos volumes
docker compose exec postgres pg_dump -U localbuddy localbuddy > demo-$(date +%F).sql
```

`docker compose down -v` deletes both volumes: every demo account, message and photo. There is no
undo.

## Choices worth knowing

- **Forwarded headers.** The API believes `X-Forwarded-For` / `-Proto` only from `DEMO_SUBNET`
  (`KnownNetworks`). Caddy on the host reaches the published port and arrives from the network's
  gateway, which is inside it; Caddy in a container, joined to this network
  (`localbuddy-demo_default`) and proxying to `api:8080`, arrives from an address inside it too. Without
  this every caller would share one rate-limit partition, the login budget included. Do not set
  `ASPNETCORE_FORWARDEDHEADERS_ENABLED`: it believes the headers from anyone.
- **CORS** is closed: the phone app is not a browser. To let a browser origin in, add
  `Cors__AllowedOrigins__0: https://...` under `api.environment` in `compose.yaml`.
- **No OpenAPI** document or UI in Demo; it exists in Development only.
- **The JWT key** lives only in `.env`. Changing it logs every phone out (tokens last 30 days and
  cannot be revoked otherwise).
