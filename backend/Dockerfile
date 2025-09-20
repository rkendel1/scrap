# Use a Node.js base image
FROM node:18-alpine

# Create the application directory inside the container
RUN mkdir -p /app/backend
WORKDIR /app/backend

# Copy package.json and tsconfig.json first to leverage Docker cache
# These paths are relative to the build context (project root)
COPY backend/package.json ./package.json
COPY backend/tsconfig.json ./tsconfig.json

# Install dependencies
RUN npm install

# Copy the rest of the backend source code
COPY backend/src ./src

# Copy wait-for-it.sh to the root /app directory (outside of /app/backend)
# This path is relative to the build context (project root)
COPY wait-for-it.sh /app/wait-for-it.sh
RUN chmod +x /app/wait-for-it.sh

# Install netcat and bash for wait-for-it.sh
RUN apk add --no-cache netcat-openbsd bash

# Build the TypeScript project
RUN npm run build

# Expose the port the app runs on
EXPOSE 3001

# Set the entrypoint to sh, and then define the command to run
# The wait-for-it.sh script is at /app/wait-for-it.sh, so reference it absolutely.
# The npm commands are run from /app/backend.
ENTRYPOINT ["/bin/sh", "-c"]
CMD ["/app/wait-for-it.sh --host=db --port=${DB_PORT:-5432} -- npm run build && npm run migrate && npm run dev"]