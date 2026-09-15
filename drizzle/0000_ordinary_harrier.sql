CREATE TABLE `wellness_days` (
	`user_id` text NOT NULL,
	`day` text NOT NULL,
	`complete` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`user_id`, `day`)
);
--> statement-breakpoint
CREATE TABLE `wellness_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`day` text NOT NULL,
	`kind` text NOT NULL,
	`data_json` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_wellness_entries_user_day` ON `wellness_entries` (`user_id`,`day`);--> statement-breakpoint
CREATE TABLE `wellness_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`data_json` text NOT NULL,
	`updated_at` text NOT NULL
);
