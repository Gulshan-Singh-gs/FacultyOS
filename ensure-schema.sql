CREATE TABLE IF NOT EXISTS `ai_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`request_id` text,
	`purpose` text NOT NULL,
	`vendor` text DEFAULT 'cloudflare_workers_ai' NOT NULL,
	`redacted_prompt_hash` text,
	`output_json` text,
	`confidence_score` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`human_reviewed_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `professor_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`file_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`file_size` integer NOT NULL,
	`category` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `requests`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS `course_members` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'ta' NOT NULL,
	`permissions_json` text DEFAULT '["triage_view"]' NOT NULL,
	`assigned_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS `department_seats` (
	`id` text PRIMARY KEY NOT NULL,
	`department_id` text NOT NULL,
	`allocated_seats` integer DEFAULT 10 NOT NULL,
	`used_seats` integer DEFAULT 0 NOT NULL,
	`annual_renewal_date` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);

CREATE TABLE IF NOT EXISTS `ledger_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`date` text NOT NULL,
	`evidence_url` text,
	`verification_status` text DEFAULT 'unverified' NOT NULL,
	`verified_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `professor_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS `request_events` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`actor_user_id` text,
	`actor_type` text NOT NULL,
	`event_type` text NOT NULL,
	`old_status` text,
	`new_status` text,
	`metadata_json` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `requests`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`provider` text DEFAULT 'paddle' NOT NULL,
	`customer_id` text,
	`provider_subscription_id` text UNIQUE,
	`price_id` text,
	`plan` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`current_period_end` integer,
	`cancel_at_period_end` integer DEFAULT 0,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `professor_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS `usage_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL UNIQUE,
	`period_start` text NOT NULL,
	`requests_this_period` integer DEFAULT 0 NOT NULL,
	`courses_active` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `professor_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
