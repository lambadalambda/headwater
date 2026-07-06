#!/usr/bin/env bash
set -euo pipefail

database_url="postgres://${DB_USER:-pleroma}:${DB_PASS:-pleroma}@${DB_HOST:-db}:${DB_PORT:-5432}/${DB_NAME:-pleroma}"

mkdir -p /var/lib/pleroma/static /var/lib/pleroma/uploads

echo "-- Waiting for database..."
until pg_isready -d "$database_url" -t 1; do
	sleep 1
done

echo "-- Running migrations..."
./bin/pleroma_ctl migrate

echo "-- Starting Pleroma..."
exec ./bin/pleroma start
