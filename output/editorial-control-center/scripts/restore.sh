#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
DEFAULT_BACKUP_DIR="${ROOT_DIR}/backups/postgres"
DEFAULT_DOCKER_SERVICE="postgres"
declare -A PROTECTED_ENV_VARS=()

log() {
  printf '[restore] %s\n' "$*"
}

fail() {
  printf '[restore] %s\n' "$*" >&2
  exit 1
}

usage() {
  cat <<'EOF'
Usage: bash scripts/restore.sh [backup-file]

Environment:
  DATABASE_URI             Source postgres connection string (required)
  BACKUP_DIR               Directory containing backups (default: backups/postgres)
  POSTGRES_TOOL_MODE       auto, local, or docker (default: auto)
  POSTGRES_DOCKER_SERVICE  Docker Compose postgres service name (default: postgres)
  RESTORE_DATABASE_NAME    Target database name for restore
  RESTORE_DATABASE_URI     Full target database URI for restore
  ALLOW_IN_PLACE_RESTORE   Set to 1 to restore into DATABASE_URI directly
EOF
}

load_env_file() {
  local file_path="$1"
  local line
  local key
  local value

  [ -f "$file_path" ] || return

  while IFS= read -r line || [ -n "$line" ]; do
    line="${line#"${line%%[![:space:]]*}"}"

    if [ -z "$line" ] || [[ "$line" == \#* ]]; then
      continue
    fi

    key="${line%%=*}"
    value="${line#*=}"
    key="${key%"${key##*[![:space:]]}"}"
    value="${value%%#*}"
    value="${value#"${value%%[![:space:]]*}"}"
    value="${value%"${value##*[![:space:]]}"}"

    if [ -z "$key" ] || [[ -n "${PROTECTED_ENV_VARS[$key]+x}" ]]; then
      continue
    fi

    export "${key}=${value}"
  done <"$file_path"
}

load_env() {
  local existing_var

  while IFS= read -r existing_var; do
    PROTECTED_ENV_VARS["$existing_var"]=1
  done < <(compgen -v)

  load_env_file "${ROOT_DIR}/.env.example"
  load_env_file "${ROOT_DIR}/.env.local"
}

resolve_path() {
  local path_value="$1"

  if [[ "$path_value" = /* ]]; then
    printf '%s\n' "$path_value"
    return
  fi

  printf '%s/%s\n' "$ROOT_DIR" "$path_value"
}

require_env() {
  local name="$1"
  local value="${!name:-}"

  if [ -z "$value" ]; then
    fail "$name is required."
  fi
}

require_command() {
  local command_name="$1"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    fail "Required command not found: $command_name"
  fi
}

has_docker_compose() {
  docker compose version >/dev/null 2>&1 || command -v docker-compose >/dev/null 2>&1
}

docker_compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose "$@"
    return
  fi

  if command -v docker-compose >/dev/null 2>&1; then
    docker-compose "$@"
    return
  fi

  fail "Docker Compose is required for docker mode."
}

detect_mode() {
  local requested_mode="${POSTGRES_TOOL_MODE:-auto}"

  case "$requested_mode" in
    local)
      require_command pg_restore
      require_command psql
      require_command createdb
      printf 'local\n'
      ;;
    docker)
      has_docker_compose || fail "POSTGRES_TOOL_MODE=docker requires Docker Compose."
      printf 'docker\n'
      ;;
    auto)
      if command -v pg_restore >/dev/null 2>&1 && command -v psql >/dev/null 2>&1 && command -v createdb >/dev/null 2>&1; then
        printf 'local\n'
      elif has_docker_compose; then
        printf 'docker\n'
      else
        fail "Install pg_restore, psql, and createdb or use Docker Compose with POSTGRES_TOOL_MODE=docker."
      fi
      ;;
    *)
      fail "Unsupported POSTGRES_TOOL_MODE: $requested_mode"
      ;;
  esac
}

database_name_from_uri() {
  local database_uri="$1"
  local without_query="${database_uri%%\?*}"
  local database_name="${without_query##*/}"

  if [ -z "$database_name" ]; then
    fail "Could not determine database name from URI."
  fi

  printf '%s\n' "$database_name"
}

replace_database_name() {
  local database_uri="$1"
  local next_database_name="$2"
  local base_uri="${database_uri%%\?*}"
  local query_string=""

  if [[ "$database_uri" == *\?* ]]; then
    query_string="?${database_uri#*\?}"
  fi

  printf '%s/%s%s\n' "${base_uri%/*}" "$next_database_name" "$query_string"
}

sanitize_database_name() {
  printf '%s' "$1" | tr -cs 'A-Za-z0-9._-' '-'
}

find_latest_backup() {
  local backup_dir="$1"
  local backup_prefix="$2"

  find "$backup_dir" -maxdepth 1 -type f -name "${backup_prefix}-*.dump" | sort -r | head -n 1
}

ensure_local_database() {
  local target_database_uri="$1"
  local target_database_name="$2"
  local maintenance_uri
  local databases

  maintenance_uri="$(replace_database_name "$target_database_uri" "postgres")"
  databases="$(psql "$maintenance_uri" -Atqc 'SELECT datname FROM pg_database')"

  if printf '%s\n' "$databases" | grep -Fxq "$target_database_name"; then
    return
  fi

  createdb --maintenance-db="$maintenance_uri" "$target_database_name"
  log "Created database $target_database_name"
}

ensure_docker_database() {
  local service_name="$1"
  local target_database_name="$2"
  local databases

  databases="$(
    docker_compose exec -T "$service_name" sh -lc \
      'exec env PGPASSWORD="$POSTGRES_PASSWORD" psql -h localhost -p 5432 -U "$POSTGRES_USER" -d postgres -Atqc "SELECT datname FROM pg_database"'
  )"

  if printf '%s\n' "$databases" | grep -Fxq "$target_database_name"; then
    return
  fi

  docker_compose exec -T "$service_name" sh -lc \
    "exec env PGPASSWORD=\"\$POSTGRES_PASSWORD\" createdb -h localhost -p 5432 -U \"\$POSTGRES_USER\" \"$target_database_name\""

  log "Created database $target_database_name"
}

run_local_restore() {
  local target_database_uri="$1"
  local backup_file="$2"

  pg_restore \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    --dbname="$target_database_uri" \
    "$backup_file"
}

run_docker_restore() {
  local service_name="$1"
  local target_database_name="$2"
  local backup_file="$3"

  cat "$backup_file" | docker_compose exec -T "$service_name" sh -lc \
    "exec env PGPASSWORD=\"\$POSTGRES_PASSWORD\" pg_restore --clean --if-exists --no-owner --no-privileges -h localhost -p 5432 -U \"\$POSTGRES_USER\" -d \"$target_database_name\""
}

main() {
  if [ "${1:-}" = "--help" ]; then
    usage
    exit 0
  fi

  if [ "$#" -gt 1 ]; then
    usage >&2
    fail "Too many arguments."
  fi

  load_env
  require_env DATABASE_URI

  local source_database_name
  local sanitized_database_name
  local backup_dir
  local docker_service
  local mode
  local target_database_uri
  local target_database_name
  local backup_file_arg="${1:-}"
  local backup_file
  local allow_in_place_restore="${ALLOW_IN_PLACE_RESTORE:-0}"

  source_database_name="$(database_name_from_uri "$DATABASE_URI")"
  sanitized_database_name="$(sanitize_database_name "$source_database_name")"
  backup_dir="$(resolve_path "${BACKUP_DIR:-$DEFAULT_BACKUP_DIR}")"
  docker_service="${POSTGRES_DOCKER_SERVICE:-$DEFAULT_DOCKER_SERVICE}"
  mode="$(detect_mode)"

  if [ -n "${RESTORE_DATABASE_URI:-}" ]; then
    target_database_uri="$RESTORE_DATABASE_URI"
  elif [ -n "${RESTORE_DATABASE_NAME:-}" ]; then
    target_database_uri="$(replace_database_name "$DATABASE_URI" "$RESTORE_DATABASE_NAME")"
  else
    target_database_uri="$DATABASE_URI"
  fi

  target_database_name="$(database_name_from_uri "$target_database_uri")"

  if [ "$target_database_uri" = "$DATABASE_URI" ] && [ "$allow_in_place_restore" != "1" ]; then
    fail "Set RESTORE_DATABASE_NAME or RESTORE_DATABASE_URI. To overwrite DATABASE_URI directly, set ALLOW_IN_PLACE_RESTORE=1."
  fi

  if [ -n "$backup_file_arg" ]; then
    backup_file="$(resolve_path "$backup_file_arg")"
  else
    backup_file="$(find_latest_backup "$backup_dir" "$sanitized_database_name")"
  fi

  if [ -z "$backup_file" ] || [ ! -f "$backup_file" ]; then
    fail "Backup file not found."
  fi

  log "Restoring $(basename "$backup_file") into ${target_database_name} using ${mode} mode."

  if [ "$mode" = "local" ]; then
    ensure_local_database "$target_database_uri" "$target_database_name"
    run_local_restore "$target_database_uri" "$backup_file"
  else
    ensure_docker_database "$docker_service" "$target_database_name"
    run_docker_restore "$docker_service" "$target_database_name" "$backup_file"
  fi

  log "Restore completed for $target_database_name"
}

main "$@"
