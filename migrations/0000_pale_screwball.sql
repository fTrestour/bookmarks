-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `bookmarks` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`title` text,
	`content` text,
	`embedding` numeric DEFAULT (NULL)
);
CREATE UNIQUE INDEX `bookmarks_url_unique` ON `bookmarks` (`url`);
CREATE TABLE `active_tokens` (
	`jti` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);

*/
SELECT * FROM bookmarks;