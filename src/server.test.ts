import { describe, it, expect, beforeEach } from "vitest";
import { server } from "./server.ts";
import { vi } from "vitest";
import * as database from "./database";
import * as config from "./config";
import * as scrapper from "./ai/scrapper.ts";
import * as embeddings from "./ai/embeddings.ts";
import { randomInt, randomUUID } from "crypto";
import { createToken } from "./authentication.ts";

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
      scrapingAiModel: "gpt-4o-mini",
      embeddingModel: "text-embedding-3-small",
      jwtSecret: "test_secret",
    });

    getPageContentSpy.mockReset().mockResolvedValue("Mock page content");

    getPageMetadataSpy.mockReset().mockResolvedValue({
      title: "Mock Title",
    });

    embedTextSpy.mockReset().mockResolvedValue(defaultEmbedding);

    const { token } = await createToken("test-token");
    testToken = token;
  });

  it("accepts calls on /", async () => {
    const response = await server.inject({
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
        },
        {
          id: randomUUID(),
          url: "https://google.com/" + randomUUID(),
          title: "Google Title",
          content: "Google content",
          embedding: randomEmbedding(),
        },
      ];

      await database.insertBookmarks(testBookmarks);

      const response = await server.inject({
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
      };
      const google = {
        id: randomUUID(),
        url: "https://google.com/" + randomUUID(),
        title: "Google Title",
        content: "Google content",
        embedding: randomEmbedding(),
      };
      const example2 = {
        id: randomUUID(),
        url: "https://example.com/" + randomUUID(),
        title: "Example Title 2",
        content: "Example content 2",
        embedding: randomEmbedding(),
      };

      const testBookmarks = [example1, google, example2];

      await database.insertBookmarks(testBookmarks);

      const searchResp = await server.inject({
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
  });

  describe("POST /bookmarks", () => {
    it("rejects unauthorized requests", async () => {
      const resp = await server.inject({
        method: "POST",
        url: "/bookmarks",
        payload: { url: "https://example.com/" + randomUUID() },
      });
      expect(resp.statusCode).toBe(401);
    });

    it("creates a bookmark", async () => {
      const url = "https://example.org/" + randomUUID();
      const response = await server.inject({
        method: "POST",
        url: "/bookmarks",
        headers: headers(),
        payload: {
          url,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({ success: true });
      expect(embedTextSpy).toHaveBeenCalled();
      expect(getPageMetadataSpy).toHaveBeenCalled();

      const bookmarks = await database.getAllBookmarks(null);
      expect(bookmarks.map((b) => b.url)).toEqual(
        expect.arrayContaining([url]),
      );
    });
  });

  describe("POST /bookmarks/batch", () => {
    it("rejects unauthorized requests", async () => {
      const resp = await server.inject({
        method: "POST",
        url: "/bookmarks/batch",
        payload: [{ url: "https://example.com/" + randomUUID() }],
      });
      expect(resp.statusCode).toBe(401);
    });

    it("creates multiple bookmarks on POST /bookmarks/batch", async () => {
      const urls = [
        "https://batch-example1.org/" + randomUUID(),
        "https://batch-example2.org/" + randomUUID(),
      ];
      const response = await server.inject({
        method: "POST",
        url: "/bookmarks/batch",
        headers: headers(),
        payload: urls.map((url) => ({ url })),
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual(
        expect.objectContaining({ success: true }),
      );
      expect(embedTextSpy).toHaveBeenCalledTimes(urls.length);
      expect(getPageMetadataSpy).toHaveBeenCalledTimes(urls.length);

      const bookmarks = await database.getAllBookmarks(null);
      expect(bookmarks.map((b) => b.url)).toEqual(expect.arrayContaining(urls));
    });
  });

  describe("DELETE /tokens/:jti", () => {
    it("rejects unauthorized requests", async () => {
      const resp = await server.inject({
        method: "DELETE",
        url: "/tokens/some-jti",
      });
      expect(resp.statusCode).toBe(401);
    });

    it("deletes a token", async () => {
      const { jti } = JSON.parse(
        (
          await server.inject({
            method: "POST",
            url: "/tokens",
            headers: headers(),
            payload: { name: "to-delete" },
          })
        ).body,
      );

      const del = await server.inject({
        method: "DELETE",
        url: `/tokens/${jti}`,
        headers: headers(),
      });

      expect(del.statusCode).toBe(200);
      expect(await database.isActiveToken(jti)).toBe(false);
    });
  });

  describe("POST /tokens", () => {
    it("rejects unauthorized requests", async () => {
      const resp = await server.inject({
        method: "POST",
        url: "/tokens",
        payload: { name: "test-token" },
      });

      expect(resp.statusCode).toBe(401);
    });

    it("creates a token", async () => {
      const resp = await server.inject({
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
