export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getActiveMemberSections } from "@/lib/services/member-sections";

export async function GET() {
  const members = await getActiveMemberSections();
  return NextResponse.json({ members });
}
