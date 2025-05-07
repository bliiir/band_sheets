FROM node:18-alpine

WORKDIR /app

# Install system dependencies required for npm packages
RUN apk add --no-cache git python3 make g++

# Copy package.json and package-lock.json first for better layer caching
COPY package*.json ./

# Install dependencies with clean npm cache to avoid issues
RUN npm cache clean --force && \
    npm install --legacy-peer-deps

# Explicitly install packages that might be causing issues to ensure they're available
RUN npm install --legacy-peer-deps \
    lucide-react \
    react-redux \
    @reduxjs/toolkit \
    class-variance-authority \
    clsx \
    tailwind-merge \
    tailwindcss-animate

# Copy the rest of the application
COPY . .

# Expose port 3000
EXPOSE 3000

# Enable file watching in Docker
ENV WATCHPACK_POLLING=true
ENV CHOKIDAR_USEPOLLING=true

# Start the application in development mode with watch enabled
CMD ["npm", "start"]
