import { run } from "@drizzle-team/brocli";
import { reindex } from "./reindex";
import { reindexAll } from "./reindex-all";

void run([reindex, reindexAll], {
  name: "bookmarks",
  description: "Bookmarks CLI",
});
