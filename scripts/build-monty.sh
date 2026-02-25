#!/usr/bin/env bash
set -euo pipefail

# Builds a Linux Monty binary for server-side execution on Vercel.
# Source repo can be overridden for forks or private mirrors.
MONTY_REPO_URL="${MONTY_REPO_URL:-https://github.com/Montekkundan/go_interpreter.git}"
GO_VERSION="${GO_VERSION:-1.25.0}"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT_BIN="$ROOT_DIR/bin/monty"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

ensure_go() {
  if command -v go >/dev/null 2>&1; then
    echo "[build-monty] using existing Go toolchain: $(go version)"
    return
  fi

  local go_tgz="go${GO_VERSION}.linux-amd64.tar.gz"
  local go_url="https://go.dev/dl/${go_tgz}"
  local go_root="$TMP_DIR/go"

  echo "[build-monty] go not found; downloading ${go_url}"
  curl -fsSL "$go_url" -o "$TMP_DIR/$go_tgz"
  tar -C "$TMP_DIR" -xzf "$TMP_DIR/$go_tgz"

  export GOROOT="$go_root"
  export PATH="$GOROOT/bin:$PATH"
  echo "[build-monty] bootstrapped Go toolchain: $(go version)"
}

echo "[build-monty] cloning $MONTY_REPO_URL"
git clone --depth=1 "$MONTY_REPO_URL" "$TMP_DIR/go_interpreter"

ensure_go

mkdir -p "$ROOT_DIR/bin"

echo "[build-monty] building linux binary"
cd "$TMP_DIR/go_interpreter"
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o "$OUT_BIN" .
chmod +x "$OUT_BIN"

echo "[build-monty] built $OUT_BIN"
