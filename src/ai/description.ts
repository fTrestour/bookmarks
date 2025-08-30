import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { err, ok } from "neverthrow";
import { getConfig } from "../config.ts";
import { createAiError, createEmptyTextError } from "../errors.ts";

export async function getDescription(search: string, content: string) {
  if (!search.trim() || !content.trim()) {
    return err(createEmptyTextError());
  }

  try {
    const { descriptionGenerationAiModel } = getConfig();

    const { text } = await generateText({
      model: openai(descriptionGenerationAiModel),
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that explains how bookmark content relates to search queries. Provide a concise explanation (1-2 sentences) of how the bookmark content matches or relates to the search query.",
        },
        {
          role: "user",
          content: `Search query: "${search}"\n\nBookmark content: ${content.substring(0, 2000)}\n\nExplain how this bookmark content relates to the search query:`,
        },
      ],
    });

    return ok(text);
  } catch (error) {
    return err(createAiError(error));
  }
}
