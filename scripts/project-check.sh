#!/usr/bin/env bash
set -euo pipefail

check="${1:-}"
if [[ -z "$check" ]]; then
  echo "usage: project-check.sh <format|lint|typecheck|test|build>" >&2
  exit 2
fi

if [[ ! -f package.json ]]; then
  echo "Skipping '$check': package.json is not present yet." >&2
  exit 0
fi

if command -v pnpm >/dev/null 2>&1 && [[ -f pnpm-lock.yaml ]]; then
  runner=(pnpm)
elif command -v npm >/dev/null 2>&1; then
  runner=(npm)
else
  echo "No supported JavaScript package manager is installed." >&2
  exit 1
fi

case "$check" in
  format) script="format:check" ;;
  lint) script="lint" ;;
  typecheck) script="typecheck" ;;
  test) script="test" ;;
  build) script="build" ;;
  *) echo "Unknown project check: $check" >&2; exit 2 ;;
esac

if ! node -e "const p=require('./package.json'); process.exit(p.scripts && p.scripts['$script'] ? 0 : 1)"; then
  echo "package.json must define a '$script' script." >&2
  exit 1
fi

"${runner[@]}" run "$script"
