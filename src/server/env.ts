export interface FacultyOSEnv {
  DB: D1Database;
  RATE_LIMIT: KVNamespace;
  NOTIFICATIONS?: Queue;
  AI_JOBS?: Queue;
  AI?: Ai;
  BETTER_AUTH_SECRET: string;
  RESEND_API_KEY: string;
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  TURNSTILE_SECRET_KEY: string;
}

export async function getServerEnv(): Promise<FacultyOSEnv> {
  let envObj: any;
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    if (ctx?.env) {
      envObj = { ...ctx.env };
    }
  } catch {
    // running outside Cloudflare edge worker (e.g. test or build)
  }
  if (!envObj) {
    envObj = { ...process.env };
  }
  if (!envObj.DB && envObj.facultyos) {
    envObj.DB = envObj.facultyos;
  }
  if (!envObj.NOTIFICATIONS && envObj.notifications) {
    envObj.NOTIFICATIONS = envObj.notifications;
  }
  return envObj as unknown as FacultyOSEnv;
}
