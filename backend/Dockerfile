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

# Install netcat and bash (keeping them as they might be useful for other debugging or scripts)
RUN apk add --no-cache netcat-openbsd bash

# Build the TypeScript project
RUN npm run build

# Expose the port the app runs on
EXPOSE 3001

# Set the entrypoint to sh, and then define the command to run
# The npm commands are run from /app/backend.
ENTRYPOINT ["/bin/sh", "-c"]
CMD ["npm run build && npm run migrate && npm run dev"]