import { randomUUID } from "crypto";
import { getPageContent } from "../src/scrapper.ts";
import type { Bookmark } from "../src/types.ts";

export async function getBookmarkDataFromUrl(url: string): Promise<Bookmark> {
  const content = await getPageContent(url);
  console.log(content);
  
  return {
    id: randomUUID(),
    url: url,
  };
}
