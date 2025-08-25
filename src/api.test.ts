import { describe, it, expect, beforeEach } from "vitest";
import { api } from "./api.ts";
import { vi } from "vitest";
import * as database from "./data/database.ts";
import * as config from "./config.ts";
import * as scrapper from "./ai/scrapper.ts";
import * as embeddings from "./ai/embeddings.ts";
import { randomInt, randomUUID } from "crypto";
import { createToken } from "./domains/authentication.ts";
import { ok } from "neverthrow";
import { insertBookmarks } from "./data/bookmarks.queries.ts";
import { isActiveToken } from "./data/active-tokens.queries.ts";
import { bookmarks } from "./data/schema.ts";

describe("api", () => {
  const getConfigSpy = vi.spyOn(config, "getConfig");
  const getPageContentSpy = vi.spyOn(scrapper, "getPageContent");
  const getPageMetadataSpy = vi.spyOn(scrapper, "getPageMetadata");
  const embedTextSpy = vi.spyOn(embeddings, "embedText");

  const defaultEmbedding = [0.1, 0.2, 0.3];
  const randomEmbedding = () => [
    randomInt(0, 100) / 100,
    randomInt(0, 100) / 100,
    randomInt(0, 100) / 100,
  ];

  let testToken: string;
  const headers = () => {
    return {
      authorization: `Bearer ${testToken}`,
    };
  };

  beforeEach(async () => {
    getConfigSpy.mockReset().mockReturnValue({
      port: 3000,
      host: "localhost",
      env: "test",
      dbUri: ":memory:",
      openaiApiKey: "dummy",
      scrapingAiModel: "gpt-4o-mini",
      embeddingModel: "text-embedding-3-small",
      jwtSecret: "test_secret",
      limit: 10,
      corsOrigins: [],
    });

    getPageContentSpy.mockReset().mockResolvedValue(ok("Mock page content"));

    getPageMetadataSpy.mockReset().mockResolvedValue(
      ok({
        title: "Mock Title",
      }),
    );

    embedTextSpy.mockReset().mockResolvedValue(ok(defaultEmbedding));

    const tokenResult = await createToken("test-token");
    if (tokenResult.isOk()) {
      testToken = tokenResult.value.token;
    }
  });

  it("accepts calls on /", async () => {
    const response = await api.inject({
      method: "GET",
      url: "/",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe("👋");
  });

  describe("GET /bookmarks", () => {
    it("returns bookmarks on /bookmarks", async () => {
      const testBookmarks = [
        {
          id: randomUUID(),
          url: "https://example.com/" + randomUUID(),
          title: "Example Title",
          content: "Example content",
          embedding: randomEmbedding(),
          status: "completed" as const,
        },
        {
          id: randomUUID(),
          url: "https://google.com/" + randomUUID(),
          title: "Google Title",
          content: "Google content",
          embedding: randomEmbedding(),
          status: "completed" as const,
        },
      ];

      const insertResult = await insertBookmarks(testBookmarks);
      expect(insertResult.isOk()).toBe(true);

      const response = await api.inject({
        method: "GET",
        url: "/bookmarks",
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual(
        testBookmarks.map((b) => ({
          id: b.id,
          url: b.url,
          title: b.title,
        })),
      );
    });

    it("searches bookmarks on /bookmarks with search query", async () => {
      const example1 = {
        id: randomUUID(),
        url: "https://example.com/" + randomUUID(),
        title: "Example Title 1",
        content: "Example content",
        embedding: defaultEmbedding,
        status: "completed" as const,
      };
      const google = {
        id: randomUUID(),
        url: "https://google.com/" + randomUUID(),
        title: "Google Title",
        content: "Google content",
        embedding: randomEmbedding(),
        status: "completed" as const,
      };
      const example2 = {
        id: randomUUID(),
        url: "https://example.com/" + randomUUID(),
        title: "Example Title 2",
        content: "Example content 2",
        embedding: randomEmbedding(),
        status: "completed" as const,
      };

      const testBookmarks = [example1, google, example2];

      const insertResult = await insertBookmarks(testBookmarks);
      expect(insertResult.isOk()).toBe(true);

      const searchResp = await api.inject({
        method: "GET",
        url: "/bookmarks",
        query: { search: "Default embedding" },
      });

      expect(searchResp.statusCode).toBe(200);
      expect((JSON.parse(searchResp.body) as unknown[])[0]).toEqual({
        id: example1.id,
        url: example1.url,
        title: example1.title,
      });
    });

    describe("limiting behavior", () => {
      beforeEach(async () => {
        // Clear all existing bookmarks
        const dbResult = await database.getDb();
        if (dbResult.isOk()) {
          await dbResult.value.delete(bookmarks);
        }
      });

      it("returns all bookmarks when no search query", async () => {
        const testBookmarks = Array.from({ length: 15 }, (_, i) => ({
          id: randomUUID(),
          url: `https://example${i}.com/` + randomUUID(),
          title: `Example Title ${i}`,
          content: `Example content ${i}`,
          embedding: randomEmbedding(),
          status: "completed" as const,
        }));

        const insertResult = await insertBookmarks(testBookmarks);
        expect(insertResult.isOk()).toBe(true);

        const response = await api.inject({
          method: "GET",
          url: "/bookmarks",
        });

        expect(response.statusCode).toBe(200);
        const bookmarks = JSON.parse(response.body) as unknown[];
        expect(bookmarks).toHaveLength(15);
      });

      it("limits results to 10 bookmarks when searching", async () => {
        const testBookmarks = Array.from({ length: 15 }, (_, i) => ({
          id: randomUUID(),
          url: `https://example${i}.com/` + randomUUID(),
          title: `Example Title ${i}`,
          content: `Example content ${i}`,
          embedding: randomEmbedding(),
          status: "completed" as const,
        }));

        const insertResult = await insertBookmarks(testBookmarks);
        expect(insertResult.isOk()).toBe(true);

        const response = await api.inject({
          method: "GET",
          url: "/bookmarks",
          query: { search: "example" },
        });

        expect(response.statusCode).toBe(200);
        const bookmarks = JSON.parse(response.body) as unknown[];
        expect(bookmarks).toHaveLength(10);
      });
    });
  });

  describe("POST /bookmarks", () => {
    it("rejects unauthorized requests", async () => {
      const resp = await api.inject({
        method: "POST",
        url: "/bookmarks",
        payload: { url: "https://example.com/" + randomUUID() },
      });
      expect(resp.statusCode).toBe(401);
    });

    it("creates a bookmark", async () => {
      const url = "https://example.org/" + randomUUID();
      const response = await api.inject({
        method: "POST",
        url: "/bookmarks",
        headers: headers(),
        payload: {
          url,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        success: true,
        stats: { processedCount: 1, successCount: 1, failedCount: 0 },
      });
      expect(embedTextSpy).toHaveBeenCalled();
      expect(getPageMetadataSpy).toHaveBeenCalled();
    });
  });

  describe("DELETE /tokens/:jti", () => {
    it("rejects unauthorized requests", async () => {
      const resp = await api.inject({
        method: "DELETE",
        url: "/tokens/some-jti",
      });
      expect(resp.statusCode).toBe(401);
    });

    it("deletes a token", async () => {
      const { jti } = JSON.parse(
        (
          await api.inject({
            method: "POST",
            url: "/tokens",
            headers: headers(),
            payload: { name: "to-delete" },
          })
        ).body,
      );

      const del = await api.inject({
        method: "DELETE",
        url: `/tokens/${jti}`,
        headers: headers(),
      });

      expect(del.statusCode).toBe(200);
      const isActiveResult = await isActiveToken(jti);
      expect(isActiveResult.isOk()).toBe(true);
      if (isActiveResult.isOk()) {
        expect(isActiveResult.value).toBe(false);
      }
    });
  });

  describe("POST /tokens", () => {
    it("rejects unauthorized requests", async () => {
      const resp = await api.inject({
        method: "POST",
        url: "/tokens",
        payload: { name: "test-token" },
      });

      expect(resp.statusCode).toBe(401);
    });

    it("creates a token", async () => {
      const resp = await api.inject({
        method: "POST",
        url: "/tokens",
        headers: headers(),
        payload: { name: "test-token" },
      });

      expect(resp.statusCode).toBe(200);
      expect(JSON.parse(resp.body)).toEqual(
        expect.objectContaining({ token: expect.any(String) }),
      );
    });
  });
});
