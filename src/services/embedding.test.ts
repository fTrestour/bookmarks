import { expect, test, describe } from "bun:test";
import { generateEmbedding, generateEmbeddings } from "./embedding";

describe("Embedding Service", () => {
  test("generateEmbedding should return a vector", async () => {
    const embedding = await generateEmbedding("test text");
    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBeGreaterThan(0);
    expect(typeof embedding[0]).toBe("number");
  });

  test("generateEmbeddings should return multiple vectors", async () => {
    const texts = ["first text", "second text", "third text"];
    const embeddings = await generateEmbeddings(texts);

    expect(embeddings).toHaveLength(texts.length);
    embeddings.forEach((embedding) => {
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBeGreaterThan(0);
    });
  });
});
