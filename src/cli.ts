import { embedText } from "./ai/embeddings.ts";
import {
  getBookmarkById,
  updateBookmark,
  getPendingBookmarks,
} from "./data/bookmarks.queries.ts";
import { processBookmark, saveBookmark } from "./domains/bookmarks.ts";

async function reindexBookmark(id: string) {
  console.log(`🔄 Reindexing bookmark with ID: ${id}`);

  const bookmarkResult = await getBookmarkById(id);
  if (bookmarkResult.isErr()) {
    console.error(`❌ Error: ${bookmarkResult.error.message}`);
    return process.exit(1);
  }

  const bookmark = bookmarkResult.value;
  console.log(`📄 Found bookmark: ${bookmark.title}`);
  console.log(`🔗 URL: ${bookmark.url}`);

  console.log(`⚙️️ Re-embedding content...`);
  if (!bookmark.content || bookmark.content.trim().length === 0) {
    console.error(
      `❌ No content available on the bookmark; cannot re-embed. Consider running "reprocess-pending" or re-fetching content first.`,
    );
    return process.exit(1);
  }

  const embeddingResult = await embedText(bookmark.content);
  if (embeddingResult.isErr()) {
    console.error(
      `❌ Failed to compute embedding for bookmark: ${embeddingResult.error.message}`,
    );
    return process.exit(1);
  }

  const embedding = embeddingResult.value;

  console.log(`💾 Updating bookmark in database...`);
  const updateResult = await updateBookmark(
    id,
    bookmark.content,
    bookmark.title ?? "Untitled", // FIXME
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

async function addBookmark(url: string) {
  console.log(`🔖 Adding bookmark: ${url}`);

  const result = await saveBookmark(url);
  if (result.isErr()) {
    console.error(`❌ Failed to add bookmark: ${result.error.message}`);
    console.error(result.error.cause);
    return process.exit(1);
  }

  const stats = result.value;
  console.log(`🎉 Successfully added bookmark!`);
  console.log(
    `📊 Stats: ${stats.processedCount} processed, ${stats.successCount} successful, ${stats.failedCount} failed`,
  );
  console.log(`⚙️ Bookmark is being processed in the background...`);
}

async function reprocessBookmarks() {
  console.log(`🔄 Finding pending bookmarks...`);

  const pendingResult = await getPendingBookmarks();
  if (pendingResult.isErr()) {
    console.error(`❌ Error: ${pendingResult.error.message}`);
    return process.exit(1);
  }

  const pendingBookmarks = pendingResult.value;

  if (pendingBookmarks.length === 0) {
    console.log(`✅ No pending bookmarks found.`);
    return;
  }

  console.log(
    `📋 Found ${pendingBookmarks.length} pending bookmark(s) to process:`,
  );

  for (const bookmark of pendingBookmarks) {
    console.log(`\n📄 Processing: ${bookmark.url} (${bookmark.id})`);
    console.log(`📅 Created: ${bookmark.createdAt.toLocaleString()}`);
    if (bookmark.errorMessage) {
      console.log(`⚠️ Previous error: ${bookmark.errorMessage}`);
    }

    const result = await processBookmark(bookmark.id);
    if (result.isErr()) {
      console.error(`❌ Failed to process bookmark: ${result.error.message}`);
      continue;
    }
    console.log(`✅ Successfully processed bookmark`);
  }

  console.log(
    `\n🎉 Finished processing ${pendingBookmarks.length} bookmark(s)`,
  );
}

// Main CLI logic
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
📚 Bookmarks CLI

Usage:
  npm run cli -- add <url>                          # Add a new bookmark
  npm run cli -- reindex <bookmark-id>              # Re-embed a specific bookmark
  npm run cli -- reprocess-pending                  # Process all pending bookmarks

Description:
  - add: Add a new bookmark URL to the system (same logic as POST /bookmarks)
  - reindex: Re-embeds an existing bookmark's content and updates the database
  - reprocess-pending: Processes all bookmarks with 'pending' or 'processing' status
`);
    return process.exit(0);
  }

  const command = args[0];
  if (command === "add") {
    const url = args[1];

    if (!url) {
      console.error(`❌ Error: Missing URL. Usage: npm run cli -- add <url>`);
      return process.exit(1);
    }

    await addBookmark(url);
  } else if (command === "reindex") {
    const bookmarkId = args[1];

    if (!bookmarkId) {
      console.error(
        `❌ Error: Missing bookmark ID. Usage: npm run cli -- reindex <bookmark-id>`,
      );
      return process.exit(1);
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(bookmarkId)) {
      console.error(
        `❌ Error: Invalid bookmark ID format. Expected UUID format.`,
      );

      return process.exit(1);
    }
    await reindexBookmark(bookmarkId);
  } else if (command === "reprocess-pending") {
    await reprocessBookmarks();
  } else {
    console.error(
      `❌ Error: Invalid command. Expected "add", "reindex" or "reprocess-pending".`,
    );
    console.log(
      `\nTry:\n  npm run cli -- add <url>\n  npm run cli -- reindex <bookmark-id>\n  npm run cli -- reprocess-pending\n`,
    );
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
