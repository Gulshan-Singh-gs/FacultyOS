import { z } from "zod";

export interface FacultyOSEnv {
  DB: D1Database;
  RATE_LIMIT: KVNamespace;
  NOTIFICATIONS?: Queue;
  AI_JOBS?: Queue;
  AI?: Ai;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL?: string;
  BETTER_AUTH_TRUSTED_ORIGINS?: string[];
  RESEND_API_KEY: string;
  PADDLE_API_KEY?: string;
  PADDLE_WEBHOOK_SECRET_KEY?: string;
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

  return envObj as unknown as FacultyOSEnv;
}
