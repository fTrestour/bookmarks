DROP INDEX "bookmarks_url_unique";--> statement-breakpoint
UPDATE `bookmarks` SET `created_at` = CURRENT_TIMESTAMP WHERE `created_at` IS NULL;--> statement-breakpoint
ALTER TABLE `bookmarks` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
CREATE UNIQUE INDEX `bookmarks_url_unique` ON `bookmarks` (`url`);