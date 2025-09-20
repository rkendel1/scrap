# Use a Node.js base image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY backend/package.json ./package.json # Corrected path
COPY backend/tsconfig.json ./tsconfig.json # Corrected path
COPY backend/src ./src

# Install wait-for-it.sh and make it executable
COPY wait-for-it.sh /app/wait-for-it.sh
RUN chmod +x /app/wait-for-it.sh

# Install netcat for wait-for-it.sh
RUN apk add --no-cache netcat-openbsd bash # Add bash as well for robustness

# Install dependencies
RUN npm install

# Build the TypeScript project
RUN npm run build

# Expose the port the app runs on
EXPOSE 3001

# Set the entrypoint to sh, and then define the command to run
# This ensures that the shell is always the primary process,
# and it executes the wait-for-it script followed by npm commands.
ENTRYPOINT ["/bin/sh", "-c"]
CMD ["/app/wait-for-it.sh --host=db --port=${DB_PORT:-5432} -- npm run build && npm run migrate && npm run dev"]