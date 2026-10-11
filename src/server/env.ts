export interface FacultyOSEnv {
  DB: D1Database;
  RATE_LIMIT: KVNamespace;
  NOTIFICATIONS?: Queue;
  AI_JOBS?: Queue;
  AI?: Ai;
  BETTER_AUTH_SECRET: string;
  RESEND_API_KEY: string;
  PADDLE_API_KEY: string;
  PADDLE_WEBHOOK_SECRET_KEY: string;
  TURNSTILE_SECRET_KEY: string;
}

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

  if (!envObj.DB && envObj.facultyos) {
    envObj.DB = envObj.facultyos;
  }
  if (!envObj.NOTIFICATIONS && envObj.notifications) {
    envObj.NOTIFICATIONS = envObj.notifications;
  }

  if (!envObj.BETTER_AUTH_SECRET) {
    envObj.BETTER_AUTH_SECRET =
      process.env.BETTER_AUTH_SECRET || "facultyos-default-secret-key-32chars-min";
  }

  return envObj as unknown as FacultyOSEnv;
}

