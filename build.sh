#!/usr/bin/env bash
#
# Build script for the Facsimile Chrome extension.
#
# Fetches Figma's capture.js (third-party, served from mcp.figma.com),
# prepends an attribution header, writes it to extension/vendor/capture.js,
# then packages the extension as facsimile-<version>.zip for the
# Chrome Web Store.
#
# capture.js is NOT committed to the repo — it is downloaded fresh on every
# build. This matches the convention used by similar community projects
# (vorbei/figma-capture, djalmajr/figma-capture-extension) and avoids
# redistributing Figma proprietary code via this git repository.
#
# Usage:  ./build.sh           (fetch + package)
#         ./build.sh --fetch   (fetch only)
#         ./build.sh --package (package only; assumes capture.js is present)

set -euo pipefail

CAPTURE_URL="https://mcp.figma.com/mcp/html-to-design/capture.js"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXT_DIR="$SCRIPT_DIR/extension"
VENDOR_DIR="$EXT_DIR/vendor"
CAPTURE_FILE="$VENDOR_DIR/capture.js"

do_fetch=1
do_package=1
case "${1:-}" in
  --fetch)   do_package=0 ;;
  --package) do_fetch=0 ;;
  "")        ;;
  *) echo "Unknown arg: $1" >&2; exit 1 ;;
esac

if [[ "$do_fetch" == "1" ]]; then
  mkdir -p "$VENDOR_DIR"

  tmp_body="$(mktemp)"
  tmp_headers="$(mktemp)"
  trap 'rm -f "$tmp_body" "$tmp_headers"' EXIT

  echo "Fetching $CAPTURE_URL ..."
  curl -fsSL -D "$tmp_headers" -o "$tmp_body" "$CAPTURE_URL"

  size=$(wc -c < "$tmp_body" | tr -d ' ')
  etag=$(awk 'tolower($1)=="etag:" { sub(/\r$/,""); print $2 }' "$tmp_headers")
  fetched=$(date -u +"%Y-%m-%d")

  echo "  size:    $size bytes"
  echo "  etag:    ${etag:-<none>}"
  echo "  fetched: $fetched"

  {
    cat <<EOF
/*!
 * capture.js — third-party code from Figma.
 *
 * Source:   $CAPTURE_URL
 * Fetched:  $fetched
 * ETag:     ${etag:-<none>}
 * Size:     $size bytes
 *
 * Bundled with this extension to comply with Chrome Web Store
 * Manifest V3 policy on remotely-hosted code (Blue Argon).
 * No modifications. Owned by Figma, Inc.
 *
 * This file is fetched at build time by ../build.sh and is NOT
 * checked into source control. To rebuild, run ./build.sh from
 * the repository root.
 */
EOF
    cat "$tmp_body"
  } > "$CAPTURE_FILE"

  echo "Wrote $CAPTURE_FILE"
fi

if [[ "$do_package" == "1" ]]; then
  if [[ ! -f "$CAPTURE_FILE" ]]; then
    echo "Error: $CAPTURE_FILE missing. Run ./build.sh --fetch first." >&2
    exit 1
  fi

  version=$(awk -F'"' '/"version":/ { print $4; exit }' "$EXT_DIR/manifest.json")
  zip_path="$SCRIPT_DIR/facsimile-$version.zip"
  rm -f "$zip_path"

  echo "Packaging extension v$version ..."
  (cd "$EXT_DIR" && zip -rq "$zip_path" . -x "*.DS_Store")
  echo "Wrote $zip_path ($(wc -c < "$zip_path" | tr -d ' ') bytes)"
fi
