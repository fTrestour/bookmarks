CREATE TABLE `active_tokens` (
	`jti` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bookmarks` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`title` text,
	`content` text,
	`embedding` blob,
	`status` text DEFAULT 'completed' NOT NULL,
	`created_at` integer NOT NULL,
	`processed_at` integer,
	`error_message` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bookmarks_url_unique` ON `bookmarks` (`url`);