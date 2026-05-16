export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth-server";
import { storeUploadedFile } from "@/lib/services/media";
import { resolveMediaUrl } from "@/lib/media";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "superuser" && user.role !== "author")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required." }, { status: 400 });
  }

  if (!process.env.R2_BUCKET) {
    return NextResponse.json({ error: "R2 is not configured." }, { status: 500 });
  }

  let media;
  try {
    media = await storeUploadedFile(file, user.id, { mode: "r2" });
    console.log(`[media] R2 upload success: ${media.id} (${media.key})`);
  } catch (error) {
    console.error("[media] Upload failed");
    console.error(error);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
  const url = resolveMediaUrl(media);

  return NextResponse.json({
    id: media.id,
    url,
    key: media.key,
    provider: media.provider,
    mimeType: media.mimeType,
    size: media.size,
    width: media.width,
    height: media.height,
  });
}
