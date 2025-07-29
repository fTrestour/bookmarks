FROM node:24 AS base
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Install only production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production --ignore-scripts && npx playwright install --with-deps chromium

COPY . .

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

ENV PORT=3000

CMD ["npm", "start"] 