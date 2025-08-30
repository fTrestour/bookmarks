import { openai } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import { err, ok } from "neverthrow";
import { chromium } from "playwright";
import { z } from "zod/v3";
import { getConfig } from "../config.ts";
import {
  createContentExtractionError,
  createScrapingError,
} from "../errors.ts";

export async function getPageContent(url: string) {
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(url, { timeout: 30000 });
    const content = await page.content();

    const { scrapingAiModel } = getConfig();

    const { text } = await generateText({
      model: openai(scrapingAiModel),
      prompt: `Please convert the following HTML content into clean, well-formatted markdown. Focus on the main content and ignore navigation, ads, and other peripheral elements. Preserve the structure and hierarchy of the content.

HTML content:
${content}`,
    });

    return ok(text);
  } catch (error) {
    return err(createScrapingError(url, error));
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function getPageMetadata(content: string, url: string) {
  const { scrapingAiModel } = getConfig();

  try {
    const { object } = await generateObject({
      model: openai(scrapingAiModel),
      schema: z.object({
        title: z.string().describe("The title of the article."),
      }),
      prompt: content,
    });
    return ok(object);
  } catch (error) {
    return err(createContentExtractionError(url, error));
  }
}
