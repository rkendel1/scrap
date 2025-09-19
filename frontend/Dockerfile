# Use a Node.js 18 image as the base
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) to the working directory
# This allows npm install to leverage Docker's cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Expose the port the app runs on
EXPOSE 5173

# Command to run the application (this will be overridden by docker-compose.yml for dev)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]