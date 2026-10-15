import { getAuth } from "@/server/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await getAuth();
    return await auth.handler(request);
  } catch (err: unknown) {
    console.error("[Auth API GET Error]", err);
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    return new Response(
      JSON.stringify({
        message,
        stack,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuth();
    return await auth.handler(request);
  } catch (err: unknown) {
    console.error("[Auth API POST Error]", err);
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    return new Response(
      JSON.stringify({
        message,
        stack,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
