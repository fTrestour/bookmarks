import { command } from "@drizzle-team/brocli";
import { getPendingBookmarks } from "../data/bookmarks.queries.ts";
import { reprocessBookmark } from "../domains/bookmarks.ts";

export const reprocessPending = command({
  name: "reprocess-pending",
  aliases: ["reprocessPending"],
  desc: "Reprocess all pending bookmarks",
  options: {},
  handler: async () => {
    console.log("🔄 Reprocessing pending bookmarks...");

    const pendingResult = await getPendingBookmarks();
    if (pendingResult.isErr()) {
      console.error(
        `❌ Error fetching pending bookmarks: ${pendingResult.error.message}`,
      );
      return process.exit(1);
    }

    const pending = pendingResult.value;
    if (pending.length === 0) {
      console.log("ℹ️ No pending bookmarks found.");
      return process.exit(0);
    }

    const total = pending.length;
    console.log(`📚 Found ${total} pending bookmarks.`);

    let processed = 0;

    for (const bookmark of pending) {
      processed += 1;
      console.log(`📈 Processing ${processed}/${total}: ${bookmark.url}`);

      await reprocessBookmark(bookmark.id, bookmark.url);
    }

    console.log(
      `🎉 Done. Initiated reprocessing for ${total} pending bookmarks.`,
    );
  },
});
