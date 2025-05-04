### Stage 1: Build
# Build stage
FROM node:22.15.0-alpine3.21 AS build

WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

### Stage 2: Production
# Production stage
FROM node:22.15.0-alpine3.21 AS production

WORKDIR /usr/src/app

# Copy package files for runtime dependency information
COPY package*.json ./

# Copy only the built app and node_modules from the build stage
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules ./node_modules

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the application port
EXPOSE $PORT

# Start the application
CMD ["node", "dist/main"]
