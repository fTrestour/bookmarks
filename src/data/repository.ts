import type { Client } from "@libsql/client";
import type { Bookmark } from "./types";

export class BookmarkRepository {
  constructor(private readonly db: Client) {}

  async create(bookmark: Bookmark): Promise<void> {
    const now = new Date().toISOString();
    const vectorArray = new Uint8Array(bookmark.vector);

    await this.db.execute({
      sql: `
        INSERT INTO bookmarks (
          id, source_id, title, url, description, created_at, updated_at, tags, vector
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        bookmark.id,
        bookmark.source_id,
        bookmark.title,
        bookmark.url,
        bookmark.description,
        now,
        now,
        JSON.stringify(bookmark.tags),
        vectorArray,
      ],
    });
  }

  async findById(id: string): Promise<Bookmark | null> {
    const result = await this.db.execute({
      sql: "SELECT * FROM bookmarks WHERE id = ?",
      args: [id],
    });

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id as string,
      source_id: row.source_id as string,
      title: row.title as string,
      url: row.url as string,
      description: row.description as string,
      tags: JSON.parse(row.tags as string),
      vector: Array.from(new Uint8Array(row.vector as ArrayBuffer)),
      created_at: new Date(row.created_at as string),
      updated_at: new Date(row.updated_at as string),
    };
  }

  async findAll(): Promise<Bookmark[]> {
    const result = await this.db.execute(
      "SELECT * FROM bookmarks ORDER BY created_at DESC"
    );

    return result.rows.map((row) => ({
      id: row.id as string,
      source_id: row.source_id as string,
      title: row.title as string,
      url: row.url as string,
      description: row.description as string,
      tags: JSON.parse(row.tags as string),
      vector: Array.from(new Uint8Array(row.vector as ArrayBuffer)),
      created_at: new Date(row.created_at as string),
      updated_at: new Date(row.updated_at as string),
    }));
  }

  async searchByVector(
    vector: number[],
    limit: number = 10
  ): Promise<Bookmark[]> {
    const vectorArray = new Uint8Array(vector);
    const result = await this.db.execute({
      sql: `
        WITH vector_scores AS (
          SELECT 
            b.id,
            b.title,
            b.url,
            b.description,
            b.tags,
            b.vector,
            b.created_at,
            b.updated_at,
            1 - vector_distance_cos(vector32(b.vector), vector32(?)) AS similarity
          FROM bookmarks b
          ORDER BY similarity DESC
          LIMIT ?
        )
        SELECT * FROM vector_scores
      `,
      args: [vectorArray, limit],
    });

    return result.rows.map((row) => ({
      id: row.id as string,
      source_id: row.source_id as string,
      title: row.title as string,
      url: row.url as string,
      description: row.description as string,
      tags: JSON.parse(row.tags as string),
      vector: Array.from(new Uint8Array(row.vector as ArrayBuffer)),
      created_at: new Date(row.created_at as string),
      updated_at: new Date(row.updated_at as string),
    }));
  }

  async getAllTags(): Promise<{ tag: string; count: number }[]> {
    const result = await this.db.execute(`
      WITH RECURSIVE split_tags AS (
        SELECT b.id as bookmark_id, json_each.value as tag
        FROM bookmarks b, json_each(b.tags)
      )
      SELECT tag, COUNT(*) as count
      FROM split_tags
      GROUP BY tag
      ORDER BY count DESC
    `);

    return result.rows.map((row) => ({
      tag: row.tag as string,
      count: row.count as number,
    }));
  }
}
