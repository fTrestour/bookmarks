import { embedText } from "./ai/embeddings.ts";
import { getBookmarkById, updateBookmark, getPendingBookmarks } from "./database.ts";
import { reprocessBookmark } from "./domains/bookmarks.ts";

async function reindexBookmark(id: string) {
  console.log(`🔄 Reindexing bookmark with ID: ${id}`);

  // Get existing bookmark
  const bookmarkResult = await getBookmarkById(id);
  if (bookmarkResult.isErr()) {
    console.error(`❌ Error: ${bookmarkResult.error.message}`);
    return process.exit(1);
  }

  const bookmark = bookmarkResult.value;
  console.log(`📄 Found bookmark: ${bookmark.title}`);
  console.log(`🔗 URL: ${bookmark.url}`);

  // Re-extract content from URL
  console.log(`⚙️️ Re-embedding content...`);
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
    bookmark.title,
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

async function reprocessPendingBookmarks() {
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

  console.log(`📋 Found ${pendingBookmarks.length} pending bookmark(s) to process:`);
  
  for (const bookmark of pendingBookmarks) {
    console.log(`\n📄 Processing: ${bookmark.url} (${bookmark.id})`);
    console.log(`📅 Created: ${bookmark.createdAt.toLocaleString()}`);
    if (bookmark.errorMessage) {
      console.log(`⚠️ Previous error: ${bookmark.errorMessage}`);
    }
    
    try {
      await reprocessBookmark(bookmark.id, bookmark.url);
      console.log(`✅ Successfully processed bookmark`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to process bookmark: ${errorMessage}`);
    }
  }
  
  console.log(`\n🎉 Finished processing ${pendingBookmarks.length} bookmark(s)`);
}

// Main CLI logic
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
📚 Bookmarks CLI

Usage:
  npm run cli -- reindex <bookmark-id>              # Re-embed a specific bookmark
  npm run cli -- reprocess-pending                  # Process all pending bookmarks

Description:
  - reindex: Re-embeds an existing bookmark's content and updates the database
  - reprocess-pending: Processes all bookmarks with 'pending' or 'processing' status
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
  } else if (command === "reprocess-pending") {
    await reprocessPendingBookmarks();
  } else {
    console.error(`❌ Error: Invalid command. Expected "reindex" or "reprocess-pending".`);
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
