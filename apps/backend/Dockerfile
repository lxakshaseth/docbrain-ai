FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package files for monorepo workspace
COPY package*.json ./
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

# Install dependencies and build
RUN npm ci
RUN npm run build:shared
RUN npm run build:backend

# Production image
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/backend ./apps/backend

WORKDIR /app/apps/backend

EXPOSE 5000

CMD ["npm", "run", "start"]
