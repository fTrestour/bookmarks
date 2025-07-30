import { openai } from "@ai-sdk/openai";
import { embed } from "ai";
import { err, ok } from "neverthrow";
import { getConfig } from "../config.ts";
import { createEmbeddingError, createEmptyTextError } from "../errors.ts";

export async function embedText(text: string) {
  if (!text.trim()) {
    return err(createEmptyTextError());
  }

  try {
    const { embeddingModel } = getConfig();
    const { embedding } = await embed({
      model: openai.embedding(embeddingModel),
      value: text,
    });
    return ok(embedding);
  } catch (error) {
    return err(createEmbeddingError(error));
  }
}
