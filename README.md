# Bookmarks

A simple bookmark manager. This application allows you to save bookmarks with automatically extracted metadata and search through them using semantic queries powered by embeddings.

[![CI](https://github.com/fTrestour/bookmarks/actions/workflows/ci.yml/badge.svg)](https://github.com/fTrestour/bookmarks/actions/workflows/ci.yml)

## Features

- **Smart Bookmark Extraction**: Automatically extracts title and content from web pages
- **AI-Powered Search**: Search bookmarks using natural language queries with semantic similarity
- **Secure API**: Token-based authentication for bookmark management
- **Rate Limiting**: Built-in protection against API abuse with configurable limits per endpoint
- **CLI Tools**: Command-line interface for bookmark management and reprocessing
- **Vector Database**: SQLite with vector support for efficient similarity search

### Quick Start

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Set up Environment Variables**
   Copy the `.env.example` file to `.env` and fill in the missing values.

3. **Start the Server**
   ```bash
   npm run dev
   ```

### Configuration

The application requires several environment variables to be configured. Copy `.env.example` to `.env` and configure:

**Required Environment Variables:**

- `OPENAI_API_KEY`: Your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
- `JWT_SECRET`: Secret key for signing JWT tokens (generate a secure random string)

**Optional Configuration:**

- `PORT`: Server port (default: 3000)
- `HOST`: Server host (default: localhost)
- `DB_URL`: Database connection URL (default: `file:sqlite/db.sqlite`)
- `SCRAPING_AI_MODEL`: AI model for content extraction (default: `gpt-4.1-mini`)
- `AI_EMBEDDING_MODEL`: AI model for generating embeddings (default: `text-embedding-3-small`)
- `NODE_ENV`: Environment mode (default: `development`)

### Rate Limiting

The API includes built-in rate limiting to prevent abuse and ensure fair usage:

**Global Rate Limits:**

- **All endpoints**: 200 requests per minute

**Endpoint-Specific Rate Limits:**

- **POST /bookmarks**: 1 request per minute (bookmark creation)
- **POST /tokens**: 1 request per hour (token creation)

**Rate Limit Behavior:**

- When rate limits are exceeded, the API returns HTTP 429 (Too Many Requests)
- Rate limiting is automatically disabled in test environment (`NODE_ENV=test`)
- Rate limits reset after the specified time window

**Rate Limit Headers:**
The API includes standard rate limiting headers in responses:

- `X-RateLimit-Limit`: Maximum number of requests allowed
- `X-RateLimit-Remaining`: Number of requests remaining in the current window
- `X-RateLimit-Reset`: Time when the rate limit window resets

## API Usage

### Authentication

The API uses JWT-based authentication for bookmark management. An admin token is required to create and manage user tokens.

#### Token Management

**Create a Token:**

```bash
curl -X POST http://localhost:3000/tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"name": "my-token"}'
```

Response:

```json
{
  "token": "jwt_token_string",
  "jti": "token_id_for_deletion"
}
```

**Delete a Token:**

```bash
curl -X DELETE http://localhost:3000/tokens/TOKEN_JTI \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Bookmark Operations

#### Add a Bookmark

```bash
curl -X POST http://localhost:3000/bookmarks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"url": "https://example.com/article"}'
```

**Processing Flow:**

1. Bookmark is immediately saved with "pending" status
2. Content extraction starts in the background
3. AI processes the content to extract title and metadata
4. Vector embeddings are generated for semantic search
5. Status updates to "completed" or "failed"

#### Search Bookmarks

```bash
# Get all bookmarks
curl http://localhost:3000/bookmarks

# Semantic search with natural language
curl "http://localhost:3000/bookmarks?search=machine learning tutorials"

# Vector similarity search
curl "http://localhost:3000/bookmarks?search=artificial intelligence"
```

### API Reference

#### Endpoints

| Method | Endpoint       | Auth Required | Description           |
| ------ | -------------- | ------------- | --------------------- |
| GET    | `/`            | No            | Health check          |
| POST   | `/tokens`      | Admin         | Create new auth token |
| DELETE | `/tokens/:jti` | Admin         | Delete auth token     |
| GET    | `/bookmarks`   | No            | List/search bookmarks |
| POST   | `/bookmarks`   | Yes           | Add new bookmark      |

#### Response Formats

**Bookmark Creation:**

```json
{
  "success": true,
  "stats": {
    "processedCount": 1,
    "successCount": 1,
    "failedCount": 0
  }
}
```

**Bookmark List:**

```json
[
  {
    "id": "uuid-string",
    "url": "https://example.com",
    "title": "Extracted Title"
  }
]
```

**Error Response:**

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## CLI Tools

The application includes a command-line interface for bookmark management:

### Available Commands

```bash
# Reindex a specific bookmark (regenerate embeddings)
npm run cli reindex <bookmark-id>

# Reindex all bookmarks in batches (default: 10 per batch)
npm run cli reindex-all [batch-size]

# Reprocess all pending bookmarks
npm run cli reprocess-pending
```

### Examples

```bash
# Reindex a specific bookmark
npm run cli reindex abc123-def456-ghi789

# Reindex all bookmarks with custom batch size
npm run cli reindex-all 5

# Reprocess any bookmarks stuck in pending state
npm run cli reprocess-pending
```

## Architecture

### Technology Stack

- **Fastify**: High-performance web framework
- **SQLite with Vector Extensions**: Database with vector similarity support
- **Drizzle ORM**: Type-safe database queries and migrations
- **OpenAI API**: Content extraction and embedding generation
- **Playwright**: Headless browser for web scraping
- **Zod**: Runtime schema validation
- **JWT**: Secure token-based authentication
- **neverthrow**: Type-safe error handling

### Key Components

- **API Layer** (`src/api.ts`): Fastify routes with authentication and rate limiting
- **Domain Logic** (`src/domains/`): Business logic for bookmarks and authentication
- **Data Layer** (`src/data/`): Database queries and schema definitions
- **AI Services** (`src/ai/`): OpenAI integration for content extraction and embeddings
- **CLI Tools** (`src/cli/`): Command-line utilities for maintenance tasks
