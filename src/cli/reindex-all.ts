import { command, number } from "@drizzle-team/brocli";
import { getAllBookmarks, updateBookmark } from "../data/bookmarks.queries.ts";
import { embedText } from "../ai/embeddings.ts";

export const reindexAll = command({
  name: "reindex-all",
  aliases: ["reindexAll"],
  desc: "Reindex all bookmarks in batches",
  options: {
    batchSize: number("positional").default(10),
  },
  handler: async ({ batchSize }) => {
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
  },
});
