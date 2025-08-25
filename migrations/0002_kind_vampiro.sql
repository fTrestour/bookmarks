ALTER TABLE `bookmarks` ADD `status` text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `bookmarks` ADD `created_at` integer;--> statement-breakpoint
ALTER TABLE `bookmarks` ADD `processed_at` integer;--> statement-breakpoint
ALTER TABLE `bookmarks` ADD `error_message` text;