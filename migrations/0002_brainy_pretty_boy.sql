ALTER TABLE `bookmarks` ADD `status` text DEFAULT 'completed' NOT NULL;--> statement-breakpoint
ALTER TABLE `bookmarks` ADD `created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
ALTER TABLE `bookmarks` ADD `processed_at` integer;--> statement-breakpoint
ALTER TABLE `bookmarks` ADD `error_message` text;