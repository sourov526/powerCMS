export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Contact export endpoint is disabled." },
    { status: 410 },
  );
}
