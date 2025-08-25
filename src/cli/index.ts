import type { command} from "@drizzle-team/brocli";
import { run } from "@drizzle-team/brocli";
import { reindex } from "./reindex.ts";
import { reindexAll } from "./reindex-all.ts";

void run(
  [
    reindex as unknown as ReturnType<typeof command>,
    reindexAll as unknown as ReturnType<typeof command>,
  ],
  {
    name: "bookmarks",
    description: "Bookmarks CLI",
  },
);
