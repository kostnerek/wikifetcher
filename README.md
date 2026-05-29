# WikiFetcher

A dockerized admin panel for downloading, scheduling, and managing offline Wikipedia ZIM files, bundled with [Kiwix](https://www.kiwix.org/) as the default reader. Aimed at home server users who want a self-hosted, always-up-to-date offline Wikipedia.

## What it does

- Periodically fetches Wikipedia ZIM dumps from `download.kiwix.org` on a configurable cron schedule
- Manages multiple languages, with or without images
- Keeps a rolling window of the latest N versions per language and cleans up the rest
- Serves the active ZIM file(s) through a bundled Kiwix container
- One-click activation swaps which ZIM Kiwix serves (restarting the Kiwix container via the Docker socket)
- Single-page admin panel: status, configuration, downloads, and history all on one screen

## Stack

- **API**: NestJS (TypeScript) + TypeORM + better-sqlite3, Node 25 Alpine
- **UI**: React + Vite + Tailwind CSS, served by Nginx
- **Reader**: official `ghcr.io/kiwix/kiwix-serve` image
- **Orchestration**: Docker Compose, two named volumes (`zim-data`, `db-data`), Docker socket mounted read-only into the API

## Quick start

```bash
git clone git@github.com:kostnerek/wikifetcher.git
cd wikifetcher
cp .env.example .env   # optional — defaults are fine
docker compose up -d
```

- Admin panel: <http://localhost:8081>
- Kiwix reader: <http://localhost:8080> (404 until you download and activate a ZIM)

From the admin panel: add a language, optionally toggle "with images", and either hit **Trigger Download Now** or wait for the cron schedule. Once a file finishes downloading, click **Activate** to serve it through Kiwix.

## Configuration

All variables are optional — sensible defaults are baked in.

| Variable               | Default       | Purpose                                |
|------------------------|---------------|----------------------------------------|
| `KIWIX_PORT`           | `8080`        | Host port for the Kiwix reader         |
| `ADMIN_PORT`           | `8081`        | Host port for the admin panel          |
| `DEFAULT_CRON`         | `0 3 * * 0`   | Initial schedule (Sun 3 AM)            |
| `DEFAULT_MAX_VERSIONS` | `3`           | Versions to keep per language          |
| `ZIM_DATA_HOST`        | `./data/zim`  | Host directory for ZIM file storage    |
| `DB_DATA_HOST`         | `./data/db`   | Host directory for the SQLite database |

Set them in `.env` next to `docker-compose.yml`. The cron expression and max-versions can also be changed live from the admin panel.

### Where do the ZIM files end up?

`ZIM_DATA_HOST` is bind-mounted into both the API and Kiwix containers, so the files live on your host filesystem at the path you choose — not inside an opaque Docker volume. The default `./data/zim` is convenient but will fill up your project directory; for a real home server, point it at a disk with room to spare:

```env
ZIM_DATA_HOST=/mnt/storage/wikifetcher/zim
DB_DATA_HOST=/mnt/storage/wikifetcher/db
```

The API auto-discovers the host path from its own mount table, so the Kiwix activate-restart flow works no matter what path you pick.

## Architecture

```
┌──────────────┐    ┌────────────────────┐    ┌──────────────────┐
│ wikifetcher- │──▶ │  wikifetcher-api   │──▶ │  download.kiwix  │
│  ui (nginx)  │    │  (NestJS + SQLite) │    │       .org       │
│   :8081      │    │   restarts kiwix   │    └──────────────────┘
└──────────────┘    │   via docker.sock  │
                    └─────────┬──────────┘
                              │ shares zim-data volume
                              ▼
                    ┌────────────────────┐
                    │    kiwix-serve     │
                    │       :8080        │
                    └────────────────────┘
```

- `zim-data` — ZIM file storage. Read/write in the API, read-only in Kiwix. Layout: `/data/zim/<lang>/<file>.zim`, with `active.zim` symlinks pointing to the currently served version.
- `db-data` — SQLite database, API only.
- `/var/run/docker.sock` — mounted read-only into the API so it can restart the Kiwix container when the active ZIM changes.

The admin panel is a **ZIM file manager**, not a Kiwix manager. Kiwix is the default reader, but any ZIM-compatible reader can be pointed at the volume.

## Local development

```bash
# API
cd api && npm install && npm run start:dev

# UI
cd ui && npm install && npm run dev
```

Tests:

```bash
cd api && npm test
```

## Notes

- No authentication — intended for a trusted home network.
- ZIM files are large (English Wikipedia maxi is ~100 GB). Make sure the host has the disk for it.
- The first boot creates the SQLite schema automatically (TypeORM `synchronize: true`).
