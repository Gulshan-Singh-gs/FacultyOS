CREATE TABLE `ai_jobs` (
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
--> statement-breakpoint
CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`r2_key` text NOT NULL,
	`file_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`file_size` integer NOT NULL,
	`category` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `requests`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`actor_user_id` text,
	`actor_type` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`metadata_json` text,
	`ip_hash` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `boundaries` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`work_days_json` text DEFAULT '["monday","tuesday","wednesday","thursday","friday"]' NOT NULL,
	`work_start` text DEFAULT '09:00' NOT NULL,
	`work_end` text DEFAULT '18:00' NOT NULL,
	`response_sla_hours` integer DEFAULT 48 NOT NULL,
	`weekend_defer` integer DEFAULT true NOT NULL,
	`vacation_mode` integer DEFAULT false NOT NULL,
	`auto_reply_template` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `professor_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `boundaries_profile_id_unique` ON `boundaries` (`profile_id`);--> statement-breakpoint
CREATE TABLE `course_members` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'ta' NOT NULL,
	`status` text DEFAULT 'invited' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `course_member_unique_idx` ON `course_members` (`course_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `courses` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`course_code` text NOT NULL,
	`course_name` text NOT NULL,
	`term` text NOT NULL,
	`syllabus_text` text,
	`access_token_hash` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `professor_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `courses_access_token_hash_unique` ON `courses` (`access_token_hash`);--> statement-breakpoint
CREATE INDEX `courses_profile_idx` ON `courses` (`profile_id`);--> statement-breakpoint
CREATE TABLE `ledger_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`role` text,
	`start_date` text,
	`end_date` text,
	`hours_per_month` integer,
	`evidence_r2_key` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `professor_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ledger_profile_idx` ON `ledger_entries` (`profile_id`);--> statement-breakpoint
CREATE TABLE `policies` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`policy_type` text NOT NULL,
	`name` text NOT NULL,
	`priority` integer DEFAULT 100 NOT NULL,
	`conditions_json` text NOT NULL,
	`actions_json` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `policies_course_idx` ON `policies` (`course_id`);--> statement-breakpoint
CREATE TABLE `professor_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`display_name` text NOT NULL,
	`institution` text,
	`faculty_title` text,
	`timezone` text DEFAULT 'Asia/Kolkata' NOT NULL,
	`plan` text DEFAULT 'free' NOT NULL,
	`ai_enabled` integer DEFAULT false NOT NULL,
	`trial_ends_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `professor_profiles_user_id_unique` ON `professor_profiles` (`user_id`);--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`report_type` text NOT NULL,
	`period_start` text NOT NULL,
	`period_end` text NOT NULL,
	`output_r2_key` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `professor_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `request_events` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`event_type` text NOT NULL,
	`actor_type` text NOT NULL,
	`payload_json` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `requests`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `requests` (
	`id` text PRIMARY KEY NOT NULL,
	`public_token` text NOT NULL,
	`course_id` text NOT NULL,
	`student_identity_id` text NOT NULL,
	`request_type` text NOT NULL,
	`status` text DEFAULT 'submitted' NOT NULL,
	`priority` text DEFAULT 'standard' NOT NULL,
	`source` text DEFAULT 'portal' NOT NULL,
	`intake_payload_json` text NOT NULL,
	`matched_policy_id` text,
	`matched_policy_version` integer,
	`policy_snapshot_json` text,
	`decision_reason_json` text,
	`penalty_percent` integer,
	`assigned_to_user_id` text,
	`professor_notes` text,
	`resolved_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_identity_id`) REFERENCES `student_identities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `requests_public_token_unique` ON `requests` (`public_token`);--> statement-breakpoint
CREATE INDEX `requests_course_idx` ON `requests` (`course_id`);--> statement-breakpoint
CREATE INDEX `requests_status_idx` ON `requests` (`status`);--> statement-breakpoint
CREATE TABLE `student_identities` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`display_label` text NOT NULL,
	`email_hash` text NOT NULL,
	`email_encrypted` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `student_course_email_idx` ON `student_identities` (`course_id`,`email_hash`);--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`provider` text DEFAULT 'razorpay' NOT NULL,
	`provider_subscription_id` text,
	`plan` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`current_period_end` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `professor_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `usage_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`period_start` text NOT NULL,
	`requests_this_period` integer DEFAULT 0 NOT NULL,
	`courses_active` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `professor_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usage_metrics_profile_id_unique` ON `usage_metrics` (`profile_id`);--> statement-breakpoint
CREATE TABLE `workload_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`snapshot_date` text NOT NULL,
	`requests_received` integer DEFAULT 0 NOT NULL,
	`auto_resolved` integer DEFAULT 0 NOT NULL,
	`manual_review` integer DEFAULT 0 NOT NULL,
	`after_hours` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `professor_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workload_profile_date_idx` ON `workload_snapshots` (`profile_id`,`snapshot_date`);