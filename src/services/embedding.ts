import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { createOllama } from "ollama-ai-provider";

function getEmbeddingModel() {
  if (process.env.OPENAI_API_KEY) {
    console.log("Using OpenAI embedding model");
    return openai.embedding("text-embedding-3-large");
  }

  console.log("Using Ollama embedding model");
  return createOllama({
    baseURL: process.env.OLLAMA_BASE_URL,
  }).embedding("nomic-embed-text");
}

export async function generateEmbedding(value: string): Promise<number[]> {
  const input = value.replaceAll("\\n", " ");
  const { embedding } = await embed({
    model: getEmbeddingModel(),
    value: input,
  });
  return embedding;
}

export async function generateEmbeddings(
  values: string[]
): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model: getEmbeddingModel(),
    values,
  });
  return embeddings;
}
