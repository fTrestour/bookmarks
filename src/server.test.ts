import { describe, it, expect, beforeEach } from "vitest";
import { server } from "./server.ts";
import { vi } from "vitest";
import * as database from "./database";
import * as config from "./config";
import * as scrapper from "./ai/scrapper.ts";
import * as embeddings from "./ai/embeddings.ts";
import { randomInt, randomUUID } from "crypto";

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

    getPageMetadataSpy.mockReset().mockResolvedValue({
      title: "Mock Title",
    });

    embedTextSpy.mockReset().mockResolvedValue(defaultEmbedding);
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
    expect(JSON.parse(response.body)).toEqual(testBookmarks);
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
    expect((JSON.parse(searchResp.body) as unknown[])[0]).toEqual(example1);
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
    expect(getPageMetadataSpy).toHaveBeenCalled();

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
    expect(getPageMetadataSpy).toHaveBeenCalledTimes(urls.length);

    const bookmarks = await database.getAllBookmarks();
    expect(bookmarks.map((b) => b.url)).toEqual(expect.arrayContaining(urls));
  });
});
