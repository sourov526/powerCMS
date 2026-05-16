export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<Record<string, string | string[] | undefined>> }
) {
  const resolvedParams = await params;
  const requestedKey = resolvedParams?.indexnowKey;
  const key = process.env.INDEXNOW_KEY;
  if (!key || typeof requestedKey !== "string" || requestedKey !== key) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(key, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
