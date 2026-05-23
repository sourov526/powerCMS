export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Apply form endpoint is disabled." },
    { status: 410 },
  );
}
