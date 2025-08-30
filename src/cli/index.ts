import { run } from "@drizzle-team/brocli";
import { reindex } from "./reindex.ts";
import { reindexAll } from "./reindex-all.ts";
import { reprocessPending } from "./reprocess-pending.ts";

void run([reindex, reindexAll, reprocessPending], {
  name: "bookmarks",
  description: "Bookmarks CLI",
});
