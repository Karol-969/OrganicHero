# Use Node.js 20 LTS as base image
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies + drizzle-kit for schema management
RUN npm ci --only=production && npm install drizzle-kit && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy other necessary files
COPY --from=builder /app/attached_assets ./attached_assets
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

# Create start script that waits for database and sets up schema
RUN echo '#!/bin/sh\necho "Waiting for database..."\nsleep 10\necho "Setting up database schema..."\nnpm run db:push || echo "Schema setup completed"\necho "Starting application..."\nnpm start' > start.sh && chmod +x start.sh

# Expose port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["./start.sh"]