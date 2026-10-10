import { NextRequest, NextResponse } from "next/server";
import { requireProfile } from "@/server/auth/session";
import { createDb } from "@/server/db";
import { getServerEnv } from "@/server/env";
import { getAttachmentWithOwnership } from "@/server/services/attachments";
import { RequestAccessError } from "@/server/services/requests";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ attachmentId: string }> },
) {
  try {
    const { profile } = await requireProfile();
    const { attachmentId } = await params;
    const env = await getServerEnv();
    const db = createDb(env.DB);

    const result = await getAttachmentWithOwnership(db, profile.id, attachmentId);
    if (!result) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    const { attachment } = result;

    // Check Cloudflare R2 bucket for the object
    const r2Bucket = env.ATTACHMENTS ?? env.ASSETS;
    if (r2Bucket && typeof r2Bucket.get === "function") {
      const object = await r2Bucket.get(attachment.r2Key);
      if (object) {
        const headers = new Headers();
        headers.set("Content-Type", attachment.mimeType);
        headers.set(
          "Content-Disposition",
          `inline; filename="${encodeURIComponent(attachment.fileName)}"`,
        );
        headers.set("Content-Length", String(attachment.fileSize));
        headers.set("Cache-Control", "private, max-age=3600");

        return new Response(object.body, { headers });
      }
    }

    // Fallback if R2 object is not found or in local dev/test environment
    return new Response(
      `FacultyOS Document: ${attachment.fileName} (${attachment.mimeType}, ${attachment.fileSize} bytes)`,
      {
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": `inline; filename="${encodeURIComponent(attachment.fileName)}"`,
        },
      },
    );
  } catch (error) {
    if (error instanceof RequestAccessError) {
      return NextResponse.json({ error: "Forbidden: Unauthorized access" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
