import { BookmarkRepository } from "../data/repository";
import type { Bookmark } from "../data/types";
import { generateEmbedding } from "./embedding";
import { randomUUID } from "crypto";

export class BookmarksService {
  constructor(private readonly repository: BookmarkRepository) {}

  async createBookmark(
    title: string,
    url: string,
    description: string,
    tags: string[],
    source_id: string
  ): Promise<Bookmark> {
    const vector = await generateEmbedding(description);
    const bookmark: Bookmark = {
      id: randomUUID(),
      source_id,
      title,
      url,
      description,
      tags,
      vector,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await this.repository.create(bookmark);
    return bookmark;
  }

  async listBookmarks() {
    return (await this.repository.findAll()).map(
      ({ vector, id, created_at, updated_at, source_id, ...bookmark }) =>
        bookmark
    );
  }

  async searchBookmarks(query: string, limit: number = 10) {
    const queryEmbedding = await generateEmbedding(query);
    return (await this.repository.searchByVector(queryEmbedding, limit)).map(
      ({ vector, id, created_at, updated_at, source_id, ...bookmark }) =>
        bookmark
    );
  }
}
