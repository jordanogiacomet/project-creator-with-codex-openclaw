#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
DEFAULT_BACKUP_DIR="${ROOT_DIR}/backups/postgres"
DEFAULT_RETENTION_COUNT=7
DEFAULT_DOCKER_SERVICE="postgres"
declare -A PROTECTED_ENV_VARS=()

log() {
  printf '[backup] %s\n' "$*"
}

fail() {
  printf '[backup] %s\n' "$*" >&2
  exit 1
}

usage() {
  cat <<'EOF'
Usage: bash scripts/backup.sh [backup-file]

Environment:
  DATABASE_URI             Postgres connection string (required)
  BACKUP_DIR               Directory for generated backups (default: backups/postgres)
  BACKUP_RETENTION_COUNT   Number of recent backups to keep per database (default: 7)
  POSTGRES_TOOL_MODE       auto, local, or docker (default: auto)
  POSTGRES_DOCKER_SERVICE  Docker Compose postgres service name (default: postgres)
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
      require_command pg_dump
      printf 'local\n'
      ;;
    docker)
      has_docker_compose || fail "POSTGRES_TOOL_MODE=docker requires Docker Compose."
      printf 'docker\n'
      ;;
    auto)
      if command -v pg_dump >/dev/null 2>&1; then
        printf 'local\n'
      elif has_docker_compose; then
        printf 'docker\n'
      else
        fail "Install pg_dump or use Docker Compose with POSTGRES_TOOL_MODE=docker."
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
    fail "Could not determine database name from DATABASE_URI."
  fi

  printf '%s\n' "$database_name"
}

sanitize_database_name() {
  printf '%s' "$1" | tr -cs 'A-Za-z0-9._-' '-'
}

validate_retention_count() {
  local retention_count="$1"

  case "$retention_count" in
    ''|*[!0-9]*)
      fail "BACKUP_RETENTION_COUNT must be a non-negative integer."
      ;;
  esac
}

cleanup_old_backups() {
  local backup_dir="$1"
  local backup_prefix="$2"
  local retention_count="$3"
  local -a backups=()
  local stale_backup

  if [ "$retention_count" -eq 0 ]; then
    log "Skipping retention cleanup because BACKUP_RETENTION_COUNT=0."
    return
  fi

  mapfile -t backups < <(find "$backup_dir" -maxdepth 1 -type f -name "${backup_prefix}-*.dump" | sort -r)

  if [ "${#backups[@]}" -le "$retention_count" ]; then
    return
  fi

  for stale_backup in "${backups[@]:retention_count}"; do
    rm -f "$stale_backup"
    log "Removed old backup $(basename "$stale_backup")"
  done
}

run_local_backup() {
  local database_uri="$1"
  local output_file="$2"

  pg_dump \
    --format=custom \
    --no-owner \
    --no-privileges \
    --file="$output_file" \
    "$database_uri"
}

run_docker_backup() {
  local service_name="$1"
  local output_file="$2"

  docker_compose exec -T "$service_name" sh -lc \
    'exec env PGPASSWORD="$POSTGRES_PASSWORD" pg_dump --format=custom --no-owner --no-privileges -h localhost -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
    >"$output_file"
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

  local database_name
  local sanitized_database_name
  local backup_dir
  local retention_count
  local docker_service
  local mode
  local timestamp
  local target_file_arg="${1:-}"
  local backup_file
  local temp_backup_file

  database_name="$(database_name_from_uri "$DATABASE_URI")"
  sanitized_database_name="$(sanitize_database_name "$database_name")"
  backup_dir="$(resolve_path "${BACKUP_DIR:-$DEFAULT_BACKUP_DIR}")"
  retention_count="${BACKUP_RETENTION_COUNT:-$DEFAULT_RETENTION_COUNT}"
  docker_service="${POSTGRES_DOCKER_SERVICE:-$DEFAULT_DOCKER_SERVICE}"
  validate_retention_count "$retention_count"
  mode="$(detect_mode)"

  mkdir -p "$backup_dir"
  timestamp="$(date -u +%Y%m%dT%H%M%SZ)"

  if [ -n "$target_file_arg" ]; then
    backup_file="$(resolve_path "$target_file_arg")"
    mkdir -p "$(dirname "$backup_file")"
  else
    backup_file="${backup_dir}/${sanitized_database_name}-${timestamp}.dump"
  fi

  temp_backup_file="${backup_file}.tmp"
  trap 'rm -f "${temp_backup_file:-}"' EXIT

  log "Creating backup for ${database_name} using ${mode} mode."

  if [ "$mode" = "local" ]; then
    run_local_backup "$DATABASE_URI" "$temp_backup_file"
  else
    run_docker_backup "$docker_service" "$temp_backup_file"
  fi

  mv "$temp_backup_file" "$backup_file"
  trap - EXIT

  if [ -z "$target_file_arg" ]; then
    cleanup_old_backups "$backup_dir" "$sanitized_database_name" "$retention_count"
  else
    log "Skipping retention cleanup because a custom output path was supplied."
  fi

  log "Backup created at $backup_file"
}

main "$@"
