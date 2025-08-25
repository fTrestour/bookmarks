-- Migration to create initial tables
CREATE TABLE `bookmarks` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`title` text,
	`content` text,
	`embedding` numeric DEFAULT (NULL)
);--> statement-breakpoint
CREATE UNIQUE INDEX `bookmarks_url_unique` ON `bookmarks` (`url`);--> statement-breakpoint
CREATE TABLE `active_tokens` (
	`jti` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);