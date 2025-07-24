import { describe, it, expect, beforeEach } from "vitest";
import { server } from "./server.ts";
import { vi } from "vitest";
import * as database from "./database";
import * as config from "./config";
import { randomUUID } from "crypto";

describe("api", () => {
  const getConfigSpy = vi.spyOn(config, "getConfig");

  beforeEach(() => {
    getConfigSpy.mockReset().mockReturnValue({
      port: 3000,
      baseUrl: "localhost",
      env: "test",
      dbUri: ":memory:",
      aiModel: "gpt-4o-mini",
    });
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
      { id: "1", url: "https://example.com" },
      { id: "2", url: "https://google.com" },
    ];

    await database.insertBookmarks(testBookmarks);

    const response = await server.inject({
      method: "GET",
      url: "/bookmarks",
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(testBookmarks);
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

    const bookmarks = await database.getAllBookmarks();
    expect(bookmarks.map((b) => b.url)).toEqual(expect.arrayContaining(urls));
  });
});
