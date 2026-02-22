#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MODELS_DIR="$ROOT_DIR/public/models"

INPUT_BRAIN="$MODELS_DIR/brain.glb"
INPUT_CHAI="$MODELS_DIR/chai.glb"
OUTPUT_BRAIN="$MODELS_DIR/brain.v2.glb"
OUTPUT_CHAI="$MODELS_DIR/chai.v2.glb"

if command -v gltf-transform >/dev/null 2>&1; then
  gltf-transform optimize "$INPUT_BRAIN" "$OUTPUT_BRAIN" --compress draco --texture-compress webp --slots "baseColorTexture,emissiveTexture,normalTexture,metallicRoughnessTexture"
  gltf-transform optimize "$INPUT_CHAI" "$OUTPUT_CHAI" --compress draco --texture-compress webp --slots "baseColorTexture,emissiveTexture,normalTexture,metallicRoughnessTexture"
  echo "Optimized models written:"
  ls -lh "$OUTPUT_BRAIN" "$OUTPUT_CHAI"
  exit 0
fi

echo "gltf-transform not found. Falling back to versioned copies."
cp -f "$INPUT_BRAIN" "$OUTPUT_BRAIN"
cp -f "$INPUT_CHAI" "$OUTPUT_CHAI"
ls -lh "$OUTPUT_BRAIN" "$OUTPUT_CHAI"
