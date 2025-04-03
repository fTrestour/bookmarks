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
    tags: string[] = []
  ): Promise<Bookmark> {
    const vector = await generateEmbedding(description);
    const bookmark: Bookmark = {
      id: randomUUID(),
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

  async listBookmarks(): Promise<Bookmark[]> {
    return this.repository.findAll();
  }

  async searchBookmarks(
    query: string,
    limit: number = 10
  ): Promise<Bookmark[]> {
    const queryEmbedding = await generateEmbedding(query);
    return this.repository.searchByVector(queryEmbedding, limit);
  }
}
