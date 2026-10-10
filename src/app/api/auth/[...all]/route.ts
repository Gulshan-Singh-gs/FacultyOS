import { getAuth } from "@/server/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await getAuth();
    return await auth.handler(request);
  } catch (err: any) {
    console.error("[Auth API GET Error]", err);
    return new Response(
      JSON.stringify({
        message: err?.message || String(err),
        stack: err?.stack,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuth();
    return await auth.handler(request);
  } catch (err: any) {
    console.error("[Auth API POST Error]", err);
    return new Response(
      JSON.stringify({
        message: err?.message || String(err),
        stack: err?.stack,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
