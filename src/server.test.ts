import { describe, it, expect } from "vitest";
import { server } from "./server.ts";
import { vi } from "vitest";
import * as database from "./database";
import * as config from "./config";

describe("api", () => {
  vi.spyOn(config, "getConfig").mockReturnValue({
    port: 3000,
    baseUrl: "localhost",
    env: "test",
    dbUri: ":memory:",
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
    const response = await server.inject({
      method: "POST",
      url: "/bookmarks",
      payload: {
        url: "https://example.org",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ success: true });

    // Verify the bookmark was actually created
    const bookmarks = await database.getAllBookmarks();
    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0].url).toBe("https://example.org");
    expect(bookmarks[0].id).toBeDefined();
  });
});
