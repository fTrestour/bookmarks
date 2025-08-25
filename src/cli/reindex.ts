import { string, command } from "@drizzle-team/brocli";
import { getBookmarkById, updateBookmark } from "../data/bookmarks.queries.ts";
import { embedText } from "../ai/embeddings.ts";

export const reindex = command({
  name: "reindex",
  desc: "Reindex a single bookmark by ID",
  options: {
    id: string("positional").required(),
  },
  handler: async ({ id }) => {
    if (!id) {
      console.error("❌ Error: Missing required <bookmark-id>");
      return process.exit(1);
    }
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.error(
        "❌ Error: Invalid bookmark ID format. Expected UUID format.",
      );
      return process.exit(1);
    }
    console.log(`🔄 Reindexing bookmark with ID: ${id}`);

    const bookmarkResult = await getBookmarkById(id);
    if (bookmarkResult.isErr()) {
      console.error(`❌ Error: ${bookmarkResult.error.message}`);
      return process.exit(1);
    }

    const bookmark = bookmarkResult.value;
    console.log(`📄 Found bookmark: ${bookmark.title ?? "No title"}`);
    console.log(`🔗 URL: ${bookmark.url}`);

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
  },
});
