# Bookmarks

A simple bookmark manager. This application allows you to save bookmarks with automatically extracted metadata and search through them using semantic queries.

![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/fTrestour/bookmarks?utm_source=oss&utm_medium=github&utm_campaign=fTrestour%2Fbookmarks&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

## Features

- **Smart Bookmark Extraction**: Automatically extracts title and content from web pages
- **AI-Powered Search**: Search bookmarks using natural language queries with semantic similarity
- **Batch Import**: Import multiple bookmarks at once

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

### API Usage

#### Add a Single Bookmark

```bash
curl -X POST http://localhost:3000/bookmarks \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/article"}'
```

#### Add Multiple Bookmarks

```bash
curl -X POST http://localhost:3000/bookmarks/batch \
  -H "Content-Type: application/json" \
  -d '[
    {"url": "https://example.com/article1"},
    {"url": "https://example.com/article2"}
  ]'
```

#### Search Bookmarks

```bash
# Get all bookmarks
curl http://localhost:3000/bookmarks

# Search bookmarks with natural language
curl "http://localhost:3000/bookmarks?search=artificial intelligence"
```

#### API Response Format

Bookmarks are returned with the following structure:

```json
{
  "id": "uuid",
  "url": "https://example.com",
  "title": "Extracted Title"
}
```

## TODO

- [ ] Add authentication
