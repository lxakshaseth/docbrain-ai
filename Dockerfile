# Stage 1: Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package management files
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/backend/package*.json ./apps/backend/

# Install all dependencies (including workspace dependencies)
RUN npm ci

# Copy source code for shared package and backend application
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

# Build shared package first, then backend
RUN npm run build:shared
RUN npm run build:backend

# Stage 2: Production runner stage
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=10000

# Copy node_modules and built code from builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/backend ./apps/backend

WORKDIR /app/apps/backend

EXPOSE 10000

CMD ["npm", "run", "start"]
