export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Apply form export endpoint is disabled." },
    { status: 410 },
  );
}
