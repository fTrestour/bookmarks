import { chromium } from "playwright";
import { openai } from "@ai-sdk/openai";
import { generateText, generateObject } from "ai";
import { z } from "zod";
import { getConfig } from "../config.ts";

export async function getPageContent(url: string): Promise<string> {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url);
  const content = await page.content();
  await browser.close();

  const { scrappingAiModel } = getConfig();

  const { text } = await generateText({
    model: openai(scrappingAiModel),
    prompt: `Please convert the following HTML content into clean, well-formatted markdown. Focus on the main content and ignore navigation, ads, and other peripheral elements. Preserve the structure and hierarchy of the content.

HTML content:
${content}`,
  });

  return text;
}

export async function getPageMetadata(
  content: string,
): Promise<{ title: string; author: string }> {
  const { scrappingAiModel } = getConfig();
  const { object } = await generateObject({
    model: openai(scrappingAiModel),
    schema: z.object({
      title: z.string(),
      author: z.string(),
    }),
    prompt:
      `Extract the article's title and author from the markdown below. ` +
      `Return JSON with keys "title" and "author" only.\n\n${content}`,
  });
  return object;
}
