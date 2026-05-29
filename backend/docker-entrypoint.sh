#!/usr/bin/env bash
set -euo pipefail

# Wait briefly for the database, then run migrations and start the API.
echo "Running database migrations..."
alembic upgrade head || {
  echo "Migration failed — retrying once after short wait..."
  sleep 3
  alembic upgrade head
}

echo "Starting API server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
