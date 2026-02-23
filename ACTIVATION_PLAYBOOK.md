# MNBARA - Docker Compose Activation Playbook

## Commands

### Phase 1 (default)

Runs infrastructure + Phase 1 services only:

- `docker compose up -d`

### Phase 2 / Phase 3 / Phase 4

- `docker compose --profile phase-2 up -d`
- `docker compose --profile phase-3 up -d`
- `docker compose --profile phase-4 up -d`

### Optional stacks

- Frontends: `docker compose --profile frontend up -d`
- Monitoring: `docker compose --profile monitoring up -d`
- Ops: `docker compose --profile ops up -d`

### Stop

- Stop everything: `docker compose down`
- Stop a single profile’s services:
  - `docker compose --profile phase-2 stop`

## Rules of engagement

### 1) Phase 1 stays clean

- Keep Phase 1 services profile-less.
- Anything non-MVP must have a `profiles: ["phase-X"]` (or `frontend` / `monitoring` / `ops`).

### 2) Avoid port collisions when enabling multiple phases

- Phase 1 ports are defined in `PORTS.md`.
- When adding a new service that exposes a port, pick a host port that does NOT collide with existing mappings.

Current known reserved/non-default host mappings:

- `compliance-service`: `3027:3027`
- `decision-authority-service`: `3030:3010` (avoids collision with `matching-service`)
- `smart-delivery-service`: `3037:3027` (avoids collision with `compliance-service`)

### 3) Legacy services build contexts

- Migrated services live under `backend/services/<service>`.
- Legacy services live under `archive/legacy-services/<service>`.

When wiring a legacy service into `docker-compose.yml`:

- Use `build.context: ./archive/legacy-services/<service>`
- Add `profiles: ["phase-2"|"phase-3"|"phase-4"]`
- Add an explicit `ports:` mapping only if needed.

### 4) Single source of truth

- `docker-compose.yml` is runtime truth.
- `services-manifest.json` is planning/registry truth.

If you change ports/profiles/paths in compose, update `services-manifest.json` accordingly.
