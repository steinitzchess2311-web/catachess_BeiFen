#!/bin/bash

# Workspace Module Database Migration Script
# Run this to apply all pending database migrations

set -e  # Exit on error

echo "=== Workspace Database Migration ==="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable not set"
    echo "Please set it to your PostgreSQL connection string"
    exit 1
fi

echo "Database: $DATABASE_URL"
echo ""

# Set working directory
cd "$(dirname "$0")"
WORKSPACE_DIR=$(pwd)

echo "Working directory: $WORKSPACE_DIR"
echo ""

# Set Python path
export PYTHONPATH="$WORKSPACE_DIR:$PYTHONPATH"

# Find alembic (try venv first, then system)
if [ -f "../../../venv/bin/alembic" ]; then
    ALEMBIC="../../../venv/bin/alembic"
elif command -v alembic &> /dev/null; then
    ALEMBIC="alembic"
else
    echo "Error: alembic not found"
    echo "Please install: pip install alembic"
    exit 1
fi

echo "Using alembic: $ALEMBIC"
echo ""

# Show current version
echo "=== Current Migration Version ==="
$ALEMBIC current || echo "No migrations applied yet"
echo ""

# Show pending migrations
echo "=== Pending Migrations ==="
$ALEMBIC history --verbose || true
echo ""

# Ask for confirmation
read -p "Apply all pending migrations? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled"
    exit 0
fi

# Run migrations
echo ""
echo "=== Applying Migrations ==="
$ALEMBIC upgrade head

echo ""
echo "=== Migration Complete ==="
$ALEMBIC current

echo ""
echo "✅ All migrations applied successfully!"
