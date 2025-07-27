import { chromium } from "playwright";
import { openai } from "@ai-sdk/openai";
import { generateText, generateObject } from "ai";
import { z } from "zod";
import { getConfig } from "../config.ts";

export async function getPageContent(url: string): Promise<string> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(url, { timeout: 30000 });
    const content = await page.content();

    const { scrappingAiModel } = getConfig();

    const { text } = await generateText({
      model: openai(scrappingAiModel),
      prompt: `Please convert the following HTML content into clean, well-formatted markdown. Focus on the main content and ignore navigation, ads, and other peripheral elements. Preserve the structure and hierarchy of the content.

HTML content:
${content}`,
    });

    return text;
  } finally {
    await browser.close();
  }
}

export async function getPageMetadata(
  content: string,
): Promise<{ title: string }> {
  const { scrappingAiModel } = getConfig();
  const { object } = await generateObject({
    model: openai(scrappingAiModel),
    schema: z.object({
      title: z.string().describe("The title of the article."),
    }),
    prompt: content,
  });
  return object;
}
