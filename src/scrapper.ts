import { chromium } from "playwright";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { getConfig } from "./config.ts";

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
