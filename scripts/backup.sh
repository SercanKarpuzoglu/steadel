#!/usr/bin/env bash
# Nightly Postgres backup (setup-guide §5, runbook §5).
# Installed on the server as a cron job:
#   /etc/cron.d/steadel-backup:
#   15 2 * * * root /opt/steadel/scripts/backup.sh >> /var/log/steadel-backup.log 2>&1
#
# Offsite push is enabled by adding to /opt/steadel/.env:
#   BACKUP_SCP_TARGET=uXXXXX@uXXXXX.your-storagebox.de:backups/
#   BACKUP_SCP_PORT=23   (optional, defaults to 23)
set -euo pipefail
cd "$(dirname "$0")/.."

BACKUP_DIR="${BACKUP_DIR:-/var/backups/steadel}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%F)"
FILE="$BACKUP_DIR/steadel-$STAMP.sql.gz"

mkdir -p "$BACKUP_DIR"
docker compose exec -T postgres pg_dump -U steadel steadel | gzip > "$FILE"
gunzip -t "$FILE"
find "$BACKUP_DIR" -name 'steadel-*.sql.gz' -mtime +"$KEEP_DAYS" -delete

# .env is not shell-sourceable (values contain spaces/angle brackets) — grep keys out.
TARGET="$(grep -E '^BACKUP_SCP_TARGET=' .env 2>/dev/null | cut -d= -f2- || true)"
PORT="$(grep -E '^BACKUP_SCP_PORT=' .env 2>/dev/null | cut -d= -f2- || true)"
if [ -n "$TARGET" ]; then
  scp -P "${PORT:-23}" "$FILE" "$TARGET"
  echo "offsite push ok: $TARGET"
fi

echo "backup ok: $FILE ($(du -h "$FILE" | cut -f1)) at $(date -Is)"
