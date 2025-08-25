DROP INDEX "bookmarks_url_unique";--> statement-breakpoint
ALTER TABLE `bookmarks` ALTER COLUMN "status" TO "status" text NOT NULL DEFAULT 'pending';--> statement-breakpoint
CREATE UNIQUE INDEX `bookmarks_url_unique` ON `bookmarks` (`url`);