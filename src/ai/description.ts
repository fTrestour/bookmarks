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
          content: `Write a concise 1 sentence description of the content that:
1. Highlights how it relates to the "${search}" query  
2. Avoids generic openers like "This article explains…"  
3. Starts immediately with the main point  
4. Stays focused and not overly verbose `,
        },
        {
          role: "user",
          content,
        },
      ],
    });

    return ok(text);
  } catch (error) {
    return err(createAiError(error));
  }
}
