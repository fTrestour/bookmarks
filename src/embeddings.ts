import { embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { getConfig } from "./config.ts";

export async function embedText(text: string): Promise<number[]> {
  const { embeddingModel } = getConfig();
  const { embedding } = await embed({
    model: openai.embedding(embeddingModel),
    value: text,
  });
  return embedding;
}
