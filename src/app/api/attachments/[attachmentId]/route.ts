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

    // Return attachment metadata (no R2 file storage — files are not persisted server-side)
    return NextResponse.json({
      id: attachment.id,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      fileSize: attachment.fileSize,
      category: attachment.category,
      createdAt: attachment.createdAt,
    });
  } catch (error) {
    if (error instanceof RequestAccessError) {
      return NextResponse.json({ error: "Forbidden: Unauthorized access" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
