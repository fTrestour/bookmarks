# bookmarks

This project is a simple bookmark manager. It exposes an api to list and query bookmarks.
It can be be plugged to various data sources, such as Pocket.

## Architecture

### Configuration

Configuration will happen through env variables. An `.env.example` shows the various env variable that need to be set for the system to work

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
- Compute an embedding for the description
  Pocket credentials are configurable in env vars

### Services

- List all bookmarks
- Semantic search in the bookmarks with a query string
- List all tags with number of bookmarks associated
- Semantic search of tag

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
