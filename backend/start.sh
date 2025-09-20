#!/bin/sh
# backend/start.sh

# Wait for the database service to be ready
echo "Waiting for database to be ready at db:5432..."
/app/wait-for-it.sh db:5432 --timeout=60 --strict -- echo "Database is up and running!"

# Run database migrations
echo "Running database migrations..."
npm run build # Ensure build is fresh before migrate
npm run migrate

# Start the backend application
echo "Starting backend application..."
npm run dev