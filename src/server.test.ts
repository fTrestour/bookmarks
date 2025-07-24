import { describe, it, expect } from "vitest";
import { server } from "./server.ts";
import { vi } from "vitest";
import * as database from "./database";

describe("api", () => {
  it("accepts calls on /", async () => {
    const response = await server.inject({
      method: "GET",
      url: "/",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe("👋");
  });

  it("returns bookmarks on /bookmarks", async () => {
    const mockBookmarks = [
      { id: "1", url: "https://example.com" },
      { id: "2", url: "https://google.com" }
    ];

    vi.spyOn(database, "getAllBookmarks").mockResolvedValue(mockBookmarks);

    const response = await server.inject({
      method: "GET",
      url: "/bookmarks",
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(mockBookmarks);
  });
});
