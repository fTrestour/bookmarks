# bookmarks

This project is a simple bookmark manager. It exposes an api to list and query bookmarks.
It can be be plugged to various data sources, such as Pocket.

## Environment Variables

The following environment variables are used to configure the application:

### Database

- `DATABASE_URL`: The URL for the libsql database. Default format: `file:./sqlite/db.sqlite`

### Embedding Service

- `OPENAI_API_KEY`: Your OpenAI API key. When provided, the service will use OpenAI's text-embedding-3-large model.
- `OLLAMA_BASE_URL`: The base URL for the Ollama API. Defaults to `http://localhost:11434`. Only used when `OPENAI_API_KEY` is not set.

## Architecture

### Database

A libsql database is used to store bookmarks.
Tables are:

- `bookmarks`: A table to store bookmarks.
  - `id`: The uuid of the bookmark.
  - `title`: The title of the bookmark.
  - `url`: The url of the bookmark.
  - `description`: The description of the bookmark.
  - `created_at`: The date the bookmark was created.
  - `updated_at`: The date the bookmark was updated.
  - `tags`: A list of tags associated with the bookmark.
  - `vector`: A vector embedding of the bookmark's description that will allow to run semantic searches.

### Data sources

#### Pocket

A Pocket webhook will sync bookmarks from Pocket to the database.
It will only sync bookmarks that are marked as favorite:

- Generate a description using an LLM with the vercel AI SDK. Model and credentials are configurable with env variables
- Compute an embedding for the description using one of these providers:
  - OpenAI's `text-embedding-3-large` model
  - Ollama's `nomic-embed-text` model (fallback for local development, requires Ollama running locally)

Pocket credentials are configurable in env vars

### Services

- List all bookmarks
- Semantic search in the bookmarks with a query string
- List all tags with number of bookmarks associated

### Interfaces

#### CLI

All services will be exposed to a CLI interface using Brocli

#### API

All routes are prefixed with `/api/v1`

#### MCP server

All services will be exposed as an SSE powered MCP server.

## Authentication

As only readonly services are to be exposed, no specific security measures are implemented

## Rate limiting

Env variables are exposed to control a global simple rate-limiting
