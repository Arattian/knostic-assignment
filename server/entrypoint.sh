#!/bin/sh
set -e

echo "Seeding database..."
node dist/seed.js

echo "Starting server..."
exec node dist/index.js
