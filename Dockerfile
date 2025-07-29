# Use Node.js 20 Alpine as base image for smaller size
FROM node:24-alpine AS base
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Install only production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production --ignore-scripts

COPY . .

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

ENV PORT=3000

CMD ["npm", "start"] 