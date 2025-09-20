# Use a Node.js 18 Alpine image as the base
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) to the working directory
# This allows npm install to leverage Docker's cache if dependencies haven't changed
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Copy the wait-for-it.sh script and the custom start script
COPY wait-for-it.sh /app/wait-for-it.sh
COPY backend/start.sh /app/start.sh

# Make the scripts executable
RUN chmod +x /app/wait-for-it.sh /app/start.sh

# Copy the rest of the application source code
COPY backend/. .

# Build the TypeScript application
RUN npm run build

# Expose the port the application runs on
EXPOSE 3001

# Define the command to run the application
# This will be overridden by docker-compose.yml
CMD ["npm", "run", "start"]