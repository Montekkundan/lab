#!/usr/bin/env bash
set -euo pipefail

# Builds a Linux Monty binary for server-side execution on Vercel.
# Source repo can be overridden for forks or private mirrors.
MONTY_REPO_URL="${MONTY_REPO_URL:-https://github.com/Montekkundan/go_interpreter.git}"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT_BIN="$ROOT_DIR/bin/monty"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

echo "[build-monty] cloning $MONTY_REPO_URL"
git clone --depth=1 "$MONTY_REPO_URL" "$TMP_DIR/go_interpreter"

if ! command -v go >/dev/null 2>&1; then
  echo "[build-monty] error: Go toolchain is required during build (go not found)." >&2
  exit 1
fi

mkdir -p "$ROOT_DIR/bin"

echo "[build-monty] building linux binary"
cd "$TMP_DIR/go_interpreter"
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o "$OUT_BIN" .
chmod +x "$OUT_BIN"

echo "[build-monty] built $OUT_BIN"
