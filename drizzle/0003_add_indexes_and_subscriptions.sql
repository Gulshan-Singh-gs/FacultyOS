PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`report_type` text NOT NULL,
	`period_start` text NOT NULL,
	`period_end` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `professor_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `__new_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`provider` text DEFAULT 'paddle' NOT NULL,
	`customer_id` text,
	`provider_subscription_id` text,
	`price_id` text,
	`plan` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`current_period_end` integer,
	`cancel_at_period_end` integer DEFAULT false,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `professor_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
INSERT INTO `__new_subscriptions`("id", "profile_id", "provider", "customer_id", "provider_subscription_id", "price_id", "plan", "status", "current_period_end", "cancel_at_period_end", "created_at", "updated_at") 
SELECT "id", "profile_id", "provider", "customer_id", "provider_subscription_id", "price_id", "plan", "status", "current_period_end", "cancel_at_period_end", "created_at", "updated_at" FROM `subscriptions`;--> statement-breakpoint
DROP TABLE `subscriptions`;--> statement-breakpoint
ALTER TABLE `__new_subscriptions` RENAME TO `subscriptions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `subscriptions_provider_subscription_id_unique` ON `subscriptions` (`provider_subscription_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `attachments_request_idx` ON `attachments` (`request_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `audit_logs_profile_created_idx` ON `audit_logs` (`profile_id`,`created_at`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `audit_logs_entity_idx` ON `audit_logs` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `ledger_profile_category_idx` ON `ledger_entries` (`profile_id`,`category`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `policies_course_priority_idx` ON `policies` (`course_id`,`priority`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `reports_profile_idx` ON `reports` (`profile_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `request_events_request_idx` ON `request_events` (`request_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `request_events_request_created_idx` ON `request_events` (`request_id`,`created_at`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `requests_course_created_idx` ON `requests` (`course_id`,`created_at`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `requests_course_status_idx` ON `requests` (`course_id`,`status`);
