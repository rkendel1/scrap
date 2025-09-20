# Use a Node.js base image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY backend/package.json ./backend/package.json
COPY backend/tsconfig.json ./backend/tsconfig.json
COPY backend/src ./src

# Install wait-for-it.sh and make it executable
COPY wait-for-it.sh /app/wait-for-it.sh
RUN chmod +x /app/wait-for-it.sh

# Install netcat for wait-for-it.sh
RUN apk add --no-cache netcat-openbsd

# Install dependencies
RUN npm install

# Build the TypeScript project
RUN npm run build

# Copy the start script
COPY backend/start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Expose the port the app runs on
EXPOSE 3001

# Command to run the application
CMD ["sh", "/app/start.sh"]