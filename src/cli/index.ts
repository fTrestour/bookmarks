import { run } from "@drizzle-team/brocli";
import { reindex } from "./reindex";
import { reindexAll } from "./reindex-all";
import { reprocessPending } from "./reprocess-pending";

void run([reindex, reindexAll, reprocessPending], {
  name: "bookmarks",
  description: "Bookmarks CLI",
});
