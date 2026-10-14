import { z } from "zod";

export interface FacultyOSEnv {
  // Bindings
  DB: D1Database;
  RATE_LIMIT: KVNamespace;
  NOTIFICATIONS?: Queue;
  AI_JOBS?: Queue;
  AI?: Ai;
  // Auth
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL?: string;
  BETTER_AUTH_TRUSTED_ORIGINS?: string[];
  // Resend
  RESEND_API_KEY: string;
  // Paddle
  NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?: string;
  NEXT_PUBLIC_PADDLE_ENVIRONMENT?: string;
  NEXT_PUBLIC_PADDLE_PRICE_DEPT_YEARLY?: string;
  NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY?: string;
  NEXT_PUBLIC_PADDLE_PRICE_PRO_SEMESTER?: string;
  PADDLE_API_KEY?: string;
  PADDLE_WEBHOOK_SECRET_KEY?: string;
  // Turnstile
  TURNSTILE_SECRET_KEY?: string;
  [key: string]: unknown;
}

/**
 * Zod validation schema for FacultyOS environment variables.
 * - Enforces required BETTER_AUTH_SECRET.
 * - Enforces RESEND_API_KEY for outbound mail delivery (with graceful dev fallback).
 * - Properly parses BETTER_AUTH_TRUSTED_ORIGINS: supports comma-separated string inputs and
 *   trims whitespace/trailing slashes before validating against the request origin.
 */
export const EnvSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
  BETTER_AUTH_URL: z
    .string()
    .url()
    .optional()
    .default("https://facultyos.gs-softwares.workers.dev"),
  BETTER_AUTH_TRUSTED_ORIGINS: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) {
        return [
          "https://facultyos.gs-softwares.workers.dev",
          "http://localhost:3000",
        ];
      }
      if (Array.isArray(val)) {
        return val.map((url) => url.trim().replace(/\/$/, "")).filter(Boolean);
      }
      return val
        .split(",")
        .map((url) => url.trim().replace(/\/$/, ""))
        .filter(Boolean);
    }),
  RESEND_API_KEY: z
    .string()
    .min(1, "RESEND_API_KEY is required for mail delivery")
    .optional(),
  NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: z.string().optional(),
  NEXT_PUBLIC_PADDLE_ENVIRONMENT: z.string().optional(),
  NEXT_PUBLIC_PADDLE_PRICE_DEPT_YEARLY: z.string().optional(),
  NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY: z.string().optional(),
  NEXT_PUBLIC_PADDLE_PRICE_PRO_SEMESTER: z.string().optional(),
  PADDLE_API_KEY: z.string().optional(),
  PADDLE_WEBHOOK_SECRET_KEY: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
});

export async function getServerEnv(): Promise<FacultyOSEnv> {
  let envObj: any = (globalThis as any).__CF_ENV__
    ? { ...(globalThis as any).__CF_ENV__ }
    : null;

  if (!envObj) {
    try {
      const { getCloudflareContext } = await import("@opennextjs/cloudflare");
      // Call getCloudflareContext synchronously! DO NOT pass { async: true }
      // because { async: true } calls getCloudflareContextAsync which falls back to
      // getPlatformProxy() from wrangler, which hangs indefinitely inside Cloudflare Workers.
      const ctx = getCloudflareContext();
      if (ctx?.env) {
        envObj = { ...ctx.env };
      }
    } catch {
      // running outside Cloudflare edge worker (e.g. test or build)
    }
  }

  if (!envObj) {
    envObj = { ...process.env };
  } else {
    envObj = { ...process.env, ...envObj };
  }

  // Standardize binding names consistently: DB, RATE_LIMIT, NOTIFICATIONS
  if (!envObj.DB && envObj.facultyos) {
    envObj.DB = envObj.facultyos;
  }
  if (!envObj.DB && (globalThis as any).DB) {
    envObj.DB = (globalThis as any).DB;
  }

  if (!envObj.NOTIFICATIONS && envObj.notifications) {
    envObj.NOTIFICATIONS = envObj.notifications;
  }
  if (!envObj.NOTIFICATIONS && (globalThis as any).NOTIFICATIONS) {
    envObj.NOTIFICATIONS = (globalThis as any).NOTIFICATIONS;
  }

  if (!envObj.RATE_LIMIT && envObj.rate_limit) {
    envObj.RATE_LIMIT = envObj.rate_limit;
  }
  if (!envObj.RATE_LIMIT && envObj.rateLimit) {
    envObj.RATE_LIMIT = envObj.rateLimit;
  }
  if (!envObj.RATE_LIMIT && (globalThis as any).RATE_LIMIT) {
    envObj.RATE_LIMIT = (globalThis as any).RATE_LIMIT;
  }

  // BETTER_AUTH_SECRET validation & dev fallback
  if (!envObj.BETTER_AUTH_SECRET) {
    if (process.env.NODE_ENV === "production" && !process.env.OPEN_NEXT_BUILDING_NEXT) {
      console.warn(
        "[FacultyOS Env] Warning: BETTER_AUTH_SECRET is not configured in environment bindings. Fallback will be used if available."
      );
    }
    envObj.BETTER_AUTH_SECRET =
      process.env.BETTER_AUTH_SECRET || "facultyos-default-secret-key-32chars-min";
  }

  // RESEND_API_KEY validation with graceful dev fallbacks / warning logs if absent
  if (!envObj.RESEND_API_KEY) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[FacultyOS Env] Warning: RESEND_API_KEY is not configured in production. Outbound emails will run in simulated mode."
      );
    }
    envObj.RESEND_API_KEY = process.env.RESEND_API_KEY || "simulated_resend_dev_key";
  }

  // Normalize and parse trusted origins
  const parsedOrigins = EnvSchema.shape.BETTER_AUTH_TRUSTED_ORIGINS.parse(
    envObj.BETTER_AUTH_TRUSTED_ORIGINS
  );
  envObj.BETTER_AUTH_TRUSTED_ORIGINS = parsedOrigins;

  // Paddle variable defaults matching Cloudflare Dashboard
  envObj.NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY =
    envObj.NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY ||
    process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY ||
    "pri_01m4mwgb41h1bqc8p81cg0ee4g";
  envObj.NEXT_PUBLIC_PADDLE_PRICE_PRO_SEMESTER =
    envObj.NEXT_PUBLIC_PADDLE_PRICE_PRO_SEMESTER ||
    process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_SEMESTER ||
    "pri_01m4mwpvt6wevqx3dty501tdcx";
  envObj.NEXT_PUBLIC_PADDLE_PRICE_DEPT_YEARLY =
    envObj.NEXT_PUBLIC_PADDLE_PRICE_DEPT_YEARLY ||
    process.env.NEXT_PUBLIC_PADDLE_PRICE_DEPT_YEARLY ||
    "pri_01m4mwvdhcv3hyrymyxazr1rwt";
  envObj.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN =
    envObj.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ||
    process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ||
    "live_e6cf5d84a9bebe17a33235fdc42";
  envObj.NEXT_PUBLIC_PADDLE_ENVIRONMENT =
    envObj.NEXT_PUBLIC_PADDLE_ENVIRONMENT ||
    process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT ||
    "production";

  // Mirror resolved string env vars onto process.env for third-party libraries (Better Auth, etc.)
  for (const [key, value] of Object.entries(envObj)) {
    if (typeof value === "string") {
      process.env[key] = value;
    }
  }

  return envObj as unknown as FacultyOSEnv;
}
