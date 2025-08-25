DROP INDEX "bookmarks_url_unique";--> statement-breakpoint
ALTER TABLE `bookmarks` ALTER COLUMN "embedding" TO "embedding" F32_BLOB(1536) DEFAULT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `bookmarks_url_unique` ON `bookmarks` (`url`);