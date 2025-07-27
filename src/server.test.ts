import { describe, it, expect, beforeEach } from "vitest";
import { server } from "./server.ts";
import { vi } from "vitest";
import * as database from "./database";
import * as config from "./config";
import * as scrapper from "./scrapper";
import * as embeddings from "./embeddings";
import { randomUUID } from "crypto";

describe("api", () => {
  const getConfigSpy = vi.spyOn(config, "getConfig");
  const getPageContentSpy = vi.spyOn(scrapper, "getPageContent");
  const embedTextSpy = vi.spyOn(embeddings, "embedText");

  beforeEach(() => {
    getConfigSpy.mockReset().mockReturnValue({
      port: 3000,
      baseUrl: "localhost",
      env: "test",
      dbUri: ":memory:",
      scrappingAiModel: "gpt-4o-mini",
      embeddingModel: "text-embedding-3-small",
    });

    getPageContentSpy.mockReset().mockResolvedValue("Mock page content");

    embedTextSpy.mockReset().mockResolvedValue([0.1, 0.2, 0.3]); // deterministic fake embedding
  });

  it("accepts calls on /", async () => {
    const response = await server.inject({
      method: "GET",
      url: "/",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe("👋");
  });

  it("returns bookmarks on /bookmarks", async () => {
    const testBookmarks = [
      {
        id: "1",
        url: "https://example.com",
        content: "Example content",
        embedding: [0.1, 0.2, 0.3],
      },
      {
        id: "2",
        url: "https://google.com",
        content: "Google content",
        embedding: [0.4, 0.5, 0.6],
      },
    ];

    await database.insertBookmarks(testBookmarks);

    const response = await server.inject({
      method: "GET",
      url: "/bookmarks",
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(testBookmarks);

    // search path
    const searchResp = await server.inject({
      method: "GET",
      url: "/bookmarks",
      query: { search: "Example content" },
    });
    expect(searchResp.statusCode).toBe(200);
    expect(embedTextSpy).toHaveBeenCalledWith("Example content");
  });

  it("creates a bookmark on POST /bookmarks", async () => {
    const url = "https://example.org/" + randomUUID();
    const response = await server.inject({
      method: "POST",
      url: "/bookmarks",
      payload: {
        url,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ success: true });
    expect(embedTextSpy).toHaveBeenCalled();

    const bookmarks = await database.getAllBookmarks();
    expect(bookmarks.map((b) => b.url)).toEqual(expect.arrayContaining([url]));
  });

  it("creates multiple bookmarks on POST /bookmarks/batch", async () => {
    const urls = [
      "https://batch-example1.org/" + randomUUID(),
      "https://batch-example2.org/" + randomUUID(),
    ];
    const response = await server.inject({
      method: "POST",
      url: "/bookmarks/batch",
      payload: urls.map((url) => ({ url })),
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ success: true });
    expect(embedTextSpy).toHaveBeenCalledTimes(urls.length);

    const bookmarks = await database.getAllBookmarks();
    expect(bookmarks.map((b) => b.url)).toEqual(expect.arrayContaining(urls));
  });
});
