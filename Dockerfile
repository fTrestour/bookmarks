FROM oven/bun:1.0.25-slim

ARG PORT=3000
ARG POCKET_SYNC_CRON="0 * * * *"    
ARG RATE_LIMIT_WINDOW_MS=900000
ARG RATE_LIMIT_MAX_REQUESTS=100
ARG OPENAI_API_KEY
ARG POCKET_CONSUMER_KEY
ARG POCKET_ACCESS_TOKEN


WORKDIR /app

COPY package.json bun.lock ./
RUN bun install

COPY . .


ENV PORT=$PORT \
    POCKET_SYNC_CRON=$POCKET_SYNC_CRON \
    RATE_LIMIT_WINDOW_MS=$RATE_LIMIT_WINDOW_MS \
    RATE_LIMIT_MAX_REQUESTS=$RATE_LIMIT_MAX_REQUESTS \
    DATABASE_URL=file:/var/db/db.sqlite

# Expose port
EXPOSE $PORT

# Create volume for database
VOLUME ["/var/db"]

RUN addgroup --system appgroup && \
    adduser --system --ingroup appgroup appuser

RUN mkdir -p /var/db && \
    chown -R appuser:appgroup /var/db

USER appuser

CMD ["bun", "run", "src/server.ts"]
