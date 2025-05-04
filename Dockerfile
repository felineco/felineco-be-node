### Stage 1: Build
FROM node:22.15.0-alpine3.21 AS build

WORKDIR /usr/src/app

# Install yarn
RUN apk add --no-cache yarn

# Copy package files and install all dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Prune non-production dependencies to prepare for copying to production stage
RUN yarn install --frozen-lockfile --production && yarn cache clean

### Stage 2: Production
FROM node:22.15.0-alpine3.21 AS production

WORKDIR /usr/src/app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Copy package.json for reference (not necessary for operation but good practice)
COPY package.json ./

# Copy only the production node_modules and built app from the build stage
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist

# Expose the application port
EXPOSE $PORT

# Start the application
CMD ["node", "dist/main"]