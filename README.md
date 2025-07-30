# Bookmarks

A simple bookmark manager. This application allows you to save bookmarks with automatically extracted metadata and search through them using semantic queries.

[![CI](https://github.com/fTrestour/bookmarks/actions/workflows/ci.yml/badge.svg)](https://github.com/fTrestour/bookmarks/actions/workflows/ci.yml)

## Features

- **Smart Bookmark Extraction**: Automatically extracts title and content from web pages
- **AI-Powered Search**: Search bookmarks using natural language queries with semantic similarity
- **Secure API**: Token-based authentication for bookmark management

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

The application requires several environment variables to be configured:

- `PORT`: Server port (default: 3000)
- `HOST`: Server host (default: localhost)
- `DB_URL`: Database connection URL (e.g., `file:sqlite/db.sqlite`)
- `OPENAI_API_KEY`: Your OpenAI API key for content extraction and embeddings
- `SCRAPING_AI_MODEL`: AI model for content extraction (e.g., `gpt-4.1-mini`)
- `AI_EMBEDDING_MODEL`: AI model for generating embeddings (e.g., `text-embedding-3-small`)
- `NODE_ENV`: Environment mode (`development` or `production`)

### API Usage

#### Authentication

The API requires token-based authentication for bookmark creation. Authentication is managed through JWT tokens.

**Create a Token:**

```bash
curl -X POST http://localhost:3000/tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"name": "my-token"}'
```

**Delete a Token:**

```bash
curl -X DELETE http://localhost:3000/tokens/TOKEN_JTI \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Add a Bookmark

```bash
curl -X POST http://localhost:3000/bookmarks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"url": "https://example.com/article"}'
```

#### Search Bookmarks

```bash
# Get all bookmarks
curl http://localhost:3000/bookmarks

# Search bookmarks with natural language
curl "http://localhost:3000/bookmarks?search=artificial intelligence"
```

#### API Response Format

**Bookmark Creation Response:**

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

**Bookmark Search Response:**

Bookmarks are returned as an array with the following structure:

```json
[
  {
    "id": "uuid",
    "url": "https://example.com",
    "title": "Extracted Title"
  }
]
```

## Development

### Available Scripts

- `npm run dev`: Start the development server with file watching
- `npm start`: Start the production server
- `npm test`: Run tests once
- `npm run test:watch`: Run tests in watch mode
- `npm run check-types`: Run TypeScript type checking
- `npm run lint`: Run ESLint
- `npm run lint:fix`: Run ESLint with automatic fixes
- `npm run format`: Format code with Prettier
- `npm run format:check`: Check code formatting

### Development Workflow

1. Start the development server: `npm run dev`
2. Make your changes
3. Run type checking: `npm run check-types`
4. Run linting: `npm run lint`
5. Format code: `npm run format`
6. Run tests: `npm run test`

## Architecture

The application is built with:

- **Fastify**: Web framework for the API
- **SQLite**: Database for storing bookmarks
- **OpenAI API**: For content extraction and embedding generation
- **Playwright**: For web scraping
- **Zod**: Runtime type validation
- **JWT**: Token-based authentication

## TODO

- [ ] Rate limiting
- [ ] Logging
- [ ] LLM tracing
- [ ] Reembed
  - ef3c3c7f-85a5-4608-9a29-d052a68416c1
  - f024b9d7-cb38-47ba-b794-553f5871b9d8
