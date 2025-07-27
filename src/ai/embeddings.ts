import { embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { getConfig } from "../config.ts";

export async function embedText(text: string): Promise<number[]> {
  if (!text.trim()) {
    throw new Error("Text cannot be empty");
  }

  try {
    const { embeddingModel } = getConfig();
    const { embedding } = await embed({
      model: openai.embedding(embeddingModel),
      value: text,
    });
    return embedding;
  } catch (error) {
    throw new Error(
      `Failed to generate embedding: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
