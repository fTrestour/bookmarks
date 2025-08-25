import { embedText } from "./ai/embeddings.ts";
import {
  getAllBookmarks,
  getBookmarkById,
  updateBookmark,
} from "./data/bookmarks.queries.ts";

async function reindexBookmark(id: string) {
  console.log(`🔄 Reindexing bookmark with ID: ${id}`);

  // Get existing bookmark
  const bookmarkResult = await getBookmarkById(id);
  if (bookmarkResult.isErr()) {
    console.error(`❌ Error: ${bookmarkResult.error.message}`);
    return process.exit(1);
  }

  const bookmark = bookmarkResult.value;
  console.log(`📄 Found bookmark: ${bookmark.title ?? "No title"}`);
  console.log(`🔗 URL: ${bookmark.url}`);

  // Re-extract content from URL
  console.log(`⚙️️ Re-embedding content...`);
  if (!bookmark.content) {
    console.error(`❌ Error: Bookmark has no content to re-embed`);
    return process.exit(1);
  }
  const embeddingResult = await embedText(bookmark.content);
  if (embeddingResult.isErr()) {
    console.error(
      `❌ Failed to extract content: ${embeddingResult.error.message}`,
    );
    return process.exit(1);
  }

  const embedding = embeddingResult.value;

  // Update bookmark in database
  console.log(`💾 Updating bookmark in database...`);
  const updateResult = await updateBookmark(
    id,
    bookmark.content,
    bookmark.title ?? "",
    embedding,
  );
  if (updateResult.isErr()) {
    console.error(
      `❌ Failed to update bookmark: ${updateResult.error.message}`,
    );
    return process.exit(1);
  }

  console.log(`🎉 Successfully reindexed bookmark with ID: ${id}`);
}

async function reindexAllBookmarks(batchSize = 10) {
  console.log("🔄 Reindexing all bookmarks...");

  const allResult = await getAllBookmarks(null);
  if (allResult.isErr()) {
    console.error(`❌ Error fetching bookmarks: ${allResult.error.message}`);
    return process.exit(1);
  }

  const all = allResult.value;
  if (all.length === 0) {
    console.log("ℹ️ No bookmarks found.");
    return process.exit(0);
  }

  let processed = 0;
  let succeeded = 0;
  let skipped = 0;
  let failed = 0;

  const total = all.length;
  console.log(`📚 Found ${total} bookmarks.`);

  for (let i = 0; i < all.length; i += batchSize) {
    const slice = all.slice(i, i + batchSize);
    await Promise.all(
      slice.map(async (b) => {
        processed += 1;
        if (!b.content) {
          skipped += 1;
          console.warn(`⏭️  Skipping ${b.id} (no content)`);
          return;
        }
        const embeddingResult = await embedText(b.content);
        if (embeddingResult.isErr()) {
          failed += 1;
          console.error(
            `❌ Failed to embed ${b.id}: ${embeddingResult.error.message}`,
          );
          return;
        }
        const upd = await updateBookmark(
          b.id,
          b.content,
          b.title ?? "",
          embeddingResult.value,
        );
        if (upd.isErr()) {
          failed += 1;
          console.error(`❌ Failed to update ${b.id}: ${upd.error.message}`);
          return;
        }
        succeeded += 1;
        console.log(`✅ Reindexed ${b.id}`);
      }),
    );
    console.log(
      `📈 Progress: ${processed}/${total} (ok: ${succeeded}, skipped: ${skipped}, failed: ${failed})`,
    );
  }

  console.log(
    `🎉 Done. Reindexed ${succeeded}, skipped ${skipped}, failed ${failed} out of ${total}.`,
  );
}

// Main CLI logic
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
📚 Bookmarks CLI

Usage:
  npm run cli -- reindex <bookmark-id>
  npm run cli -- reindex-all [batchSize]

Description:
  Reindexes a bookmark by re-embedding its content, and updating the database.
  Reindexes all bookmarks in batches (default batchSize=10).
`);
    return process.exit(0);
  }

  const command = args[0];
  if (command === "reindex") {
    const bookmarkId = args[1];

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(bookmarkId)) {
      console.error(
        `❌ Error: Invalid bookmark ID format. Expected UUID format.`,
      );

      return process.exit(1);
    }
    await reindexBookmark(bookmarkId);
  } else if (command === "reindex-all") {
    const batchArg = args[1];
    const batchSize = batchArg ? Math.max(1, Number(batchArg)) : 10;
    if (Number.isNaN(batchSize)) {
      console.error("❌ Error: batchSize must be a number");
      return process.exit(1);
    }
    await reindexAllBookmarks(batchSize);
  } else {
    console.error(`❌ Error: Invalid command. Expected "reindex".`);
    return process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Run the CLI
main().catch((error: unknown) => {
  console.error(
    `❌ Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`,
  );
  process.exit(1);
});
