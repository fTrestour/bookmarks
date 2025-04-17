FROM oven/bun:1.0.25-slim

ENV NODE_ENV=production
ENV PORT=3000
ENV POCKET_SYNC_CRON="0 * * * *"    
ENV RATE_LIMIT_WINDOW_MS=900000
ENV RATE_LIMIT_MAX_REQUESTS=100
ENV DATABASE_URL=file:/var/db/db.sqlite

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install

COPY . .

EXPOSE $PORT

VOLUME ["/var/db"]

CMD ["bun", "run", "src/server.ts"]
