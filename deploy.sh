#!/usr/bin/env bash
# Safe deploy. Builds FIRST, without touching running containers, then swaps.
#
# Why: `docker compose up -d --build` stops/recreates containers and *then*
# spends minutes building. Docker 29.6.1 has a BuildKit panic
# ("concurrent map iteration and map write") that kills the daemon mid-build —
# which left production down twice, because compose had already stopped the
# containers and a deliberately-stopped container is not resurrected by
# `restart: unless-stopped`. Building first means a daemon crash costs us a
# failed build, not an outage.
set -euo pipefail
cd /opt/steadel

echo "=== 1. pull ==="
git pull

echo "=== 2. build (containers keep running) ==="
if ! docker compose build "$@"; then
  echo "!! BUILD FAILED — production untouched, still serving the old image."
  echo "   (If the daemon panicked, just run this script again.)"
  exit 1
fi

echo "=== 3. swap (seconds) ==="
docker compose up -d --no-build

echo "=== 4. health ==="
sleep 6
for url in https://app.steadel.com/ https://app.steadel.com/login https://steadel.com/; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 "$url" || echo 000)
  echo "  $code  $url"
  [ "$code" = "200" ] || { echo "!! $url is not healthy"; exit 1; }
done
docker compose ps --format "  {{.Name}}  {{.Status}}"
echo "=== deploy OK ==="
