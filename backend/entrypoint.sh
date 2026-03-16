#!/bin/bash
set -e

# Wait for database
# Strip SQLAlchemy dialect prefix for raw asyncpg connection
PG_URL=$(echo "$DATABASE_URL" | sed 's|postgresql+asyncpg://|postgresql://|')
until python -c "import asyncio, asyncpg; asyncio.run(asyncpg.connect('$PG_URL'))" 2>/dev/null; do
  echo "Waiting for database..."
  sleep 2
done

echo "Database is ready."

# Run migrations
echo "Running database migrations..."
alembic upgrade head
echo "Migrations complete."

# Start server
echo "Starting uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
