# Backup and Restore

## Overview

`scripts/backup.sh` creates PostgreSQL backups with `pg_dump --format=custom`, which keeps the archive compressed and compatible with selective restores via `pg_restore`.

`scripts/restore.sh` restores one of those custom-format archives into a target database. By default the restore script refuses to overwrite `DATABASE_URI` unless `ALLOW_IN_PLACE_RESTORE=1` is set.

Both scripts load `.env.example` first and `.env.local` second. Variables already present in the shell environment take precedence, and `.env.local` overrides `.env.example`.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URI` | none | Primary PostgreSQL connection string used by the app and the backup scripts |
| `BACKUP_DIR` | `backups/postgres` | Directory where backup archives are written and searched |
| `BACKUP_RETENTION_COUNT` | `7` | Number of recent backup files kept per database |
| `POSTGRES_TOOL_MODE` | `auto` | `local`, `docker`, or `auto` |
| `POSTGRES_DOCKER_SERVICE` | `postgres` | Docker Compose service used for docker-mode backup or restore |
| `RESTORE_DATABASE_NAME` | unset | Safer restore target name when restoring into another database |
| `RESTORE_DATABASE_URI` | unset | Full restore target URI when the target host or credentials differ |
| `ALLOW_IN_PLACE_RESTORE` | `0` | Set to `1` to restore directly into `DATABASE_URI` |

## Retention Policy

The default retention policy is to keep the latest 7 backup files for each database. When the backup script runs once per day, that means 7 daily backups are retained.

Set `BACKUP_RETENTION_COUNT=0` to disable automatic cleanup.

## Running Backups

Host or container with PostgreSQL client tools available:

```bash
bash scripts/backup.sh
```

Force local PostgreSQL tooling:

```bash
POSTGRES_TOOL_MODE=local bash scripts/backup.sh
```

Force Docker Compose execution when the host does not have `pg_dump` installed:

```bash
POSTGRES_TOOL_MODE=docker bash scripts/backup.sh
```

Write to a custom file path:

```bash
bash scripts/backup.sh backups/postgres/manual.dump
```

Generated files use the pattern `<database>-<timestamp>.dump` with a UTC timestamp.

## Restore Procedure

Restore the latest backup into a test database:

```bash
RESTORE_DATABASE_NAME=editorial_control_center_restore_test bash scripts/restore.sh
```

Restore a specific archive into a test database:

```bash
RESTORE_DATABASE_NAME=editorial_control_center_restore_test \
  bash scripts/restore.sh backups/postgres/editorial_control_center-YYYYMMDDTHHMMSSZ.dump
```

Restore in place only when you intend to overwrite the database referenced by `DATABASE_URI`:

```bash
ALLOW_IN_PLACE_RESTORE=1 bash scripts/restore.sh backups/postgres/editorial_control_center-YYYYMMDDTHHMMSSZ.dump
```

## Manual Restore Test

Manual restore was tested on 2026-03-20 UTC against a temporary PostgreSQL 14 instance using the same `DATABASE_URI` shape as the application.

Test flow:

1. Start PostgreSQL and point `DATABASE_URI` at it
2. Create a backup: `bash scripts/backup.sh`
3. Restore into a scratch database: `RESTORE_DATABASE_NAME=editorial_control_center_restore_test bash scripts/restore.sh`
4. Verify the restored database contains the expected table and rows

Expected verification checks:

- `backup_validation_records` exists in the restored database
- `SELECT count(*) FROM backup_validation_records` returns `2`
- The restore script exits with status `0`

## Notes

- `POSTGRES_TOOL_MODE=auto` prefers local PostgreSQL client tools when available.
- Docker mode runs `pg_dump` and `pg_restore` inside the `postgres` Compose service, which lets the scripts work even when the host is missing PostgreSQL client binaries.
- Local mode also works inside a container, as long as `DATABASE_URI`, `pg_dump`, `pg_restore`, `psql`, and `createdb` are available there.
