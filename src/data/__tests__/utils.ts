import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { initDb } from "../db";

export async function setupTestDb() {
  const url = `file:./sqlite/test-${Date.now()}.sqlite`;
  await mkdir(dirname(url.replace("file:", "")), { recursive: true });
  const db = await initDb(url);

  console.log("Test database created at:", url);

  return { db, url };
}

export async function teardownTestDb(url: string) {
  try {
    const filePath = url.replace("file:", "");
    await Bun.file(filePath).delete();
  } catch (error) {
    console.error("Error cleaning up test database: ", error);
  }
}
