# bookmarks

[![Build](https://github.com/fTrestour/bookmarks/actions/workflows/ci.yml/badge.svg)](https://github.com/fTrestour/bookmarks/actions/workflows/ci.yml)

This project is a simple bookmark manager. It exposes an api to list and query bookmarks.
It can be be plugged to various data sources, such as Pocket.

## Setup

1. Start Ollama server (required for local development):

```bash
ollama serve
```

2. Get Pocket credentials:
   - Create a new app at https://getpocket.com/developer/apps/new
   - Copy your consumer key
   - Run the auth command to get an access token:
   ```bash
   bun run auth-pocket
   ```
   - Follow the instructions in the console to authorize the app
   - Add the access token to your `.env` file

## Environment Variables

The following environment variables are used to configure the application:

### Database

- `DATABASE_URL`: The URL for the libsql database. Default format: `file:./sqlite/db.sqlite`

### Embedding Service

- `OPENAI_API_KEY`: Your OpenAI API key. When provided, the service will use OpenAI's text-embedding-3-large model.
- `OLLAMA_BASE_URL`: The base URL for the Ollama API. Defaults to `http://localhost:11434`. Only used when `OPENAI_API_KEY` is not set.

### Pocket

- `POCKET_CONSUMER_KEY`: Your Pocket app's consumer key
- `POCKET_ACCESS_TOKEN`: Your Pocket access token (obtained through the auth-pocket command)
- `POCKET_SYNC_CRON`: Cron expression for Pocket sync schedule. Defaults to "0 \* \* \* \*" (every hour)

### Rate Limiting

- `RATE_LIMIT_WINDOW_MS`: The time window for rate limiting in milliseconds. Defaults to 15 minutes (900000ms).
- `RATE_LIMIT_MAX_REQUESTS`: The maximum number of requests allowed per window per IP. Defaults to 100.

### Server

- `PORT`: The port number the server will listen on. Required.

### Logging

- `NODE_ENV`: The environment the application is running in. When set to 'development', debug logs will be enabled.
- Logs are written to:
  - Console (all environments)
  - `logs/error.log` (error level and above)
  - `logs/combined.log` (all levels)

Available log levels:

- `error`: For errors that need immediate attention
- `warn`: For potentially harmful situations
- `info`: For general operational information
- `http`: For HTTP request logging
- `debug`: For detailed information useful during development

## Architecture

### Database

A libsql database is used to store bookmarks.
Tables are:

- `bookmarks`: A table to store bookmarks.
  - `id`: The uuid of the bookmark.
  - `source_id`: The ID from the source (e.g. Pocket item ID).
  - `title`: The title of the bookmark.
  - `url`: The url of the bookmark.
  - `description`: The description of the bookmark.
  - `created_at`: The date the bookmark was created.
  - `updated_at`: The date the bookmark was updated.
  - `tags`: A list of tags associated with the bookmark.
  - `vector`: A vector embedding of the bookmark's description that will allow to run semantic searches.

### Data sources

#### Pocket

Pocket bookmarks are synced periodically using a cron job:

- Only syncs bookmarks that are marked as favorite
- Compute an embedding for the description using one of these providers:
  - OpenAI's `text-embedding-3-large` model
  - Ollama's `nomic-embed-text` model (fallback for local development, requires Ollama running locally)

Pocket credentials and sync schedule are configurable in env vars

### Services

- List all bookmarks
- Semantic search in the bookmarks with a query string
- List all tags with number of bookmarks associated

### Interfaces

#### API

All routes are prefixed with `/api`

Available endpoints:

- `GET /api/bookmarks` - List all bookmarks
  ```json
  [
    {
      "title": "Example Bookmark",
      "url": "https://example.com",
      "description": "A description of the bookmark",
      "tags": ["tag1", "tag2"]
    }
  ]
  ```
- `GET /api/bookmarks?search=query&limit=10` - Search bookmarks using semantic search
  - `search`: The search query (required for search)
  - `limit`: Maximum number of results to return (optional, defaults to 10)
- `GET /api/tags` - List all tags with their counts

## Authentication

As only readonly services are to be exposed, no specific security measures are implemented

## Rate limiting

Rate limiting is optional and can be enabled by setting both `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX_REQUESTS` environment variables. When enabled, it limits the number of requests per IP address within a time window.

# TODO

- [ ] Add an SSE powered MCP server to expose the resources
