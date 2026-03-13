#!/bin/bash
# Ralph Loop — OpenClaw Project Initializer
# Usage: ./ralph.sh [max_iterations]

set -euo pipefail

MAX_ITERATIONS="${1:-8}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PRD_FILE="$SCRIPT_DIR/PRD.md"
DECISIONS_FILE="$SCRIPT_DIR/decisions.md"
PROGRESS_FILE="$SCRIPT_DIR/progress.txt"
AGENTS_FILE="$SCRIPT_DIR/AGENTS.md"
STORIES_DIR="$SCRIPT_DIR/docs/stories"

if [[ ! -f "$PRD_FILE" ]]; then
  echo "Error: missing $PRD_FILE"
  exit 1
fi

if [[ ! -f "$DECISIONS_FILE" ]]; then
  echo "Error: missing $DECISIONS_FILE"
  exit 1
fi

if [[ ! -f "$PROGRESS_FILE" ]]; then
  echo "Error: missing $PROGRESS_FILE"
  exit 1
fi

if [[ ! -f "$AGENTS_FILE" ]]; then
  echo "Error: missing $AGENTS_FILE"
  exit 1
fi

if [[ ! -d "$STORIES_DIR" ]]; then
  echo "Error: missing $STORIES_DIR"
  exit 1
fi

get_story_status() {
  local file="$1"

  awk '
    /^## Status$/ { in_status=1; next }
    in_status && /^`[^`]+`$/ {
      gsub(/`/, "", $0)
      print $0
      exit
    }
  ' "$file"
}

get_next_story() {
  local first_todo=""

  while IFS= read -r file; do
    local status
    status="$(get_story_status "$file" || true)"

    case "$status" in
      in_progress)
        echo "$file"
        return 0
        ;;
      todo)
        if [[ -z "$first_todo" ]]; then
          first_todo="$file"
        fi
        ;;
    esac
  done < <(find "$STORIES_DIR" -maxdepth 1 -type f -name 'ST-*.md' | sort)

  if [[ -n "$first_todo" ]]; then
    echo "$first_todo"
    return 0
  fi

  return 1
}

all_stories_done() {
  local found_any=0

  while IFS= read -r file; do
    found_any=1
    local status
    status="$(get_story_status "$file" || true)"

    if [[ "$status" != "done" ]]; then
      return 1
    fi
  done < <(find "$STORIES_DIR" -maxdepth 1 -type f -name 'ST-*.md' | sort)

  [[ "$found_any" -eq 1 ]]
}

append_progress() {
  local status="$1"
  local message="$2"
  local timestamp
  timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

  echo "[$timestamp] INFO — $status — $message" >> "$PROGRESS_FILE"
}

build_prompt() {
  local story_file="$1"
  local prompt_file="$2"

  cat > "$prompt_file" <<EOF
You are running inside the OpenClaw Project Initializer repository through Ralph loop.

Follow AGENTS.md exactly.

Execution wrapper for this run:
- Work on exactly one story only.
- The selected story for this iteration is: ${story_file}
- Read order:
  1. PRD.md
  2. decisions.md
  3. progress.txt
  4. README.md if it exists
  5. docs/V0.md if it exists
  6. ${story_file}
- If the selected story is already done, do not pick a different one automatically in this same run.
- Make only the smallest coherent change needed for that story.
- Update progress.txt with what you changed and any validation you actually ran.
- Update the story status only if the story is genuinely complete.
- Do not implement future stories.
- Do not touch production, deploy, or perform unrelated refactors.
- If blocked, record the blocker in progress.txt and stop.

Completion rule for this exec call:
- If all stories in docs/stories are done, print exactly COMPLETE.
- Otherwise print a short result summary for the story you worked on.

Below is AGENTS.md for repository-local operating rules.

EOF

  cat "$AGENTS_FILE" >> "$prompt_file"
}

run_codex() {
  local story_file="$1"
  local prompt_file
  local output_file

  prompt_file="$(mktemp "$SCRIPT_DIR/.ralph-prompt.XXXXXX.md")"
  output_file="$(mktemp "$SCRIPT_DIR/.codex-last-message.XXXXXX.txt")"

  cleanup() {
    rm -f "$prompt_file" "$output_file"
  }
  trap cleanup RETURN

  build_prompt "$story_file" "$prompt_file"

  npx -y @openai/codex@latest exec \
    --model gpt-5.4 \
    --config 'model_reasoning_effort="xhigh"' \
    --sandbox danger-full-access \
    --json \
    --output-last-message "$output_file" \
    - < "$prompt_file"

  if [[ -f "$output_file" ]]; then
    cat "$output_file"
  fi
}

echo "Starting Ralph Loop — OpenClaw Project Initializer"
echo "Max iterations: $MAX_ITERATIONS"
echo "PRD: $PRD_FILE"
echo "Decisions: $DECISIONS_FILE"
echo "Progress: $PROGRESS_FILE"
echo "Stories: $STORIES_DIR"
echo "Prompt source: $AGENTS_FILE"

if all_stories_done; then
  echo "All stories are already done."
  exit 0
fi

for i in $(seq 1 "$MAX_ITERATIONS"); do
  echo ""
  echo "==============================================================="
  echo "  Ralph Loop Iteration $i of $MAX_ITERATIONS"
  echo "==============================================================="

  if all_stories_done; then
    echo "All stories completed."
    exit 0
  fi

  NEXT_STORY="$(get_next_story || true)"

  if [[ -z "${NEXT_STORY:-}" ]]; then
    echo "No todo/in_progress story found."
    echo "Check $STORIES_DIR manually."
    exit 1
  fi

  echo "Selected story: $NEXT_STORY"

  OUTPUT="$(run_codex "$NEXT_STORY" 2>&1 | tee /dev/stderr)" || true

  if echo "$OUTPUT" | grep -q "^COMPLETE$"; then
    echo ""
    echo "Ralph loop reported COMPLETE."
    exit 0
  fi

  if all_stories_done; then
    echo ""
    echo "All stories completed."
    exit 0
  fi

  echo "Iteration $i complete."
  sleep 2
done

echo ""
echo "Ralph loop reached max iterations ($MAX_ITERATIONS) without finishing all stories."
echo "Check $PROGRESS_FILE and $STORIES_DIR for current status."
exit 1