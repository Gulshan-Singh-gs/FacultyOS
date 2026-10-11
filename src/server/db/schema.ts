import { sql } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";

const now = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`);
const touched = () =>
  integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`);

/* ---------- Better Auth tables ---------- */

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  image: text("image"),
  createdAt: now(),
  updatedAt: touched(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: now(),
  updatedAt: touched(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: now(),
  updatedAt: touched(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: now(),
  updatedAt: touched(),
});

/* ---------- Identity ---------- */

export const professorProfiles = sqliteTable("professor_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  institution: text("institution"),
  facultyTitle: text("faculty_title"),
  timezone: text("timezone").notNull().default("Asia/Kolkata"),
  plan: text("plan", { enum: ["free", "pro", "department"] })
    .notNull()
    .default("free"),
  aiEnabled: integer("ai_enabled", { mode: "boolean" })
    .notNull()
    .default(false),
  trialEndsAt: integer("trial_ends_at", { mode: "timestamp_ms" }),
  createdAt: now(),
  updatedAt: touched(),
});

/* ---------- Courses ---------- */

export const courses = sqliteTable(
  "courses",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id")
      .notNull()
      .references(() => professorProfiles.id, { onDelete: "cascade" }),
    courseCode: text("course_code").notNull(),
    courseName: text("course_name").notNull(),
    term: text("term").notNull(),
    syllabusText: text("syllabus_text"),
    accessTokenHash: text("access_token_hash").notNull().unique(),
    status: text("status", { enum: ["active", "archived"] })
      .notNull()
      .default("active"),
    createdAt: now(),
    updatedAt: touched(),
  },
  (t) => [index("courses_profile_idx").on(t.profileId)],
);

export const courseMembers = sqliteTable(
  "course_members",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    role: text("role", { enum: ["owner", "ta", "grader"] })
      .notNull()
      .default("ta"),
    status: text("status", { enum: ["active", "invited", "removed"] })
      .notNull()
      .default("invited"),
    createdAt: now(),
    updatedAt: touched(),
  },
  (t) => [
    uniqueIndex("course_member_unique_idx").on(t.courseId, t.userId),
  ],
);

/* ---------- Policy engine ---------- */

export const policies = sqliteTable(
  "policies",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    policyType: text("policy_type").notNull(),
    name: text("name").notNull(),
    priority: integer("priority").notNull().default(100),
    conditionsJson: text("conditions_json").notNull(),
    actionsJson: text("actions_json").notNull(),
    version: integer("version").notNull().default(1),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: now(),
    updatedAt: touched(),
  },
  (t) => [index("policies_course_idx").on(t.courseId)],
);

/* ---------- Student interactions ---------- */

export const studentIdentities = sqliteTable(
  "student_identities",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    displayLabel: text("display_label").notNull(),
    emailHash: text("email_hash").notNull(),
    emailEncrypted: text("email_encrypted"), // only when notifications require it
    createdAt: now(),
    updatedAt: touched(),
  },
  (t) => [
    uniqueIndex("student_course_email_idx").on(t.courseId, t.emailHash),
  ],
);

export const requests = sqliteTable(
  "requests",
  {
    id: text("id").primaryKey(),
    publicToken: text("public_token").notNull().unique(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    studentIdentityId: text("student_identity_id")
      .notNull()
      .references(() => studentIdentities.id),
    requestType: text("request_type").notNull(),
    status: text("status").notNull().default("submitted"),
    priority: text("priority", { enum: ["urgent", "standard", "low"] })
      .notNull()
      .default("standard"),
    source: text("source", { enum: ["portal", "email", "ta_created"] })
      .notNull()
      .default("portal"),
    intakePayloadJson: text("intake_payload_json").notNull(),
    matchedPolicyId: text("matched_policy_id"),
    matchedPolicyVersion: integer("matched_policy_version"),
    policySnapshotJson: text("policy_snapshot_json"),
    decisionReasonJson: text("decision_reason_json"),
    penaltyPercent: integer("penalty_percent"),
    assignedToUserId: text("assigned_to_user_id"),
    professorNotes: text("professor_notes"),
    resolvedAt: integer("resolved_at", { mode: "timestamp_ms" }),
    createdAt: now(),
    updatedAt: touched(),
  },
  (t) => [
    index("requests_course_idx").on(t.courseId),
    index("requests_status_idx").on(t.status),
  ],
);

export const requestEvents = sqliteTable("request_events", {
  id: text("id").primaryKey(),
  requestId: text("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  actorType: text("actor_type").notNull(), // student | professor | ta | system | ai
  payloadJson: text("payload_json"),
  createdAt: now(),
});

export const attachments = sqliteTable("attachments", {
  id: text("id").primaryKey(),
  requestId: text("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  category: text("category").notNull(), // non-medical categories only (Hard Rule 1)
  createdAt: now(),
});

/* ---------- AI guardrail ledger ---------- */

export const aiJobs = sqliteTable("ai_jobs", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .references(() => professorProfiles.id, { onDelete: "cascade" }),
  requestId: text("request_id"),
  purpose: text("purpose").notNull(), // classify | draft | extract_policy | summarize
  vendor: text("vendor").notNull().default("cloudflare_workers_ai"),
  redactedPromptHash: text("redacted_prompt_hash"),
  outputJson: text("output_json"),
  confidenceScore: integer("confidence_score"), // 0-100
  status: text("status").notNull().default("pending"),
  humanReviewedBy: text("human_reviewed_by"),
  createdAt: now(),
});

/* ---------- Boundaries & workload ---------- */

export const boundaries = sqliteTable("boundaries", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .unique()
    .references(() => professorProfiles.id, { onDelete: "cascade" }),
  workDaysJson: text("work_days_json")
    .notNull()
    .default('["monday","tuesday","wednesday","thursday","friday"]'),
  workStart: text("work_start").notNull().default("09:00"),
  workEnd: text("work_end").notNull().default("18:00"),
  responseSlaHours: integer("response_sla_hours").notNull().default(48),
  weekendDefer: integer("weekend_defer", { mode: "boolean" })
    .notNull()
    .default(true),
  vacationMode: integer("vacation_mode", { mode: "boolean" })
    .notNull()
    .default(false),
  autoReplyTemplate: text("auto_reply_template"),
  createdAt: now(),
  updatedAt: touched(),
});

export const workloadSnapshots = sqliteTable(
  "workload_snapshots",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id")
      .notNull()
      .references(() => professorProfiles.id, { onDelete: "cascade" }),
    snapshotDate: text("snapshot_date").notNull(), // YYYY-MM-DD
    requestsReceived: integer("requests_received").notNull().default(0),
    autoResolved: integer("auto_resolved").notNull().default(0),
    manualReview: integer("manual_review").notNull().default(0),
    afterHours: integer("after_hours").notNull().default(0),
    createdAt: now(),
  },
  (t) => [
    uniqueIndex("workload_profile_date_idx").on(t.profileId, t.snapshotDate),
  ],
);

/* ---------- Career ledger ---------- */

export const ledgerEntries = sqliteTable(
  "ledger_entries",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id")
      .notNull()
      .references(() => professorProfiles.id, { onDelete: "cascade" }),
    category: text("category").notNull(), // service | publication | grant | teaching | advising
    title: text("title").notNull(),
    role: text("role"),
    startDate: text("start_date"),
    endDate: text("end_date"),
    hoursPerMonth: integer("hours_per_month"),
    notes: text("notes"),
    createdAt: now(),
    updatedAt: touched(),
  },
  (t) => [index("ledger_profile_idx").on(t.profileId)],
);

export const reports = sqliteTable("reports", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .references(() => professorProfiles.id, { onDelete: "cascade" }),
  reportType: text("report_type").notNull(),
  periodStart: text("period_start").notNull(),
  periodEnd: text("period_end").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: now(),
});

/* ---------- Compliance ---------- */

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  profileId: text("profile_id").notNull(),
  actorUserId: text("actor_user_id"),
  actorType: text("actor_type").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  metadataJson: text("metadata_json"),
  ipHash: text("ip_hash"),
  createdAt: now(),
});

export const usageMetrics = sqliteTable("usage_metrics", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .unique()
    .references(() => professorProfiles.id, { onDelete: "cascade" }),
  periodStart: text("period_start").notNull(),
  requestsThisPeriod: integer("requests_this_period").notNull().default(0),
  coursesActive: integer("courses_active").notNull().default(0),
  updatedAt: touched(),
});

export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .references(() => professorProfiles.id, { onDelete: "cascade" }),
  provider: text("provider").notNull().default("razorpay"),
  providerSubscriptionId: text("provider_subscription_id"),
  plan: text("plan").notNull(),
  status: text("status").notNull().default("active"),
  currentPeriodEnd: integer("current_period_end", { mode: "timestamp_ms" }),
  createdAt: now(),
  updatedAt: touched(),
});
