export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth-server";
import { clearTwoFactorOtp, getUserById, setTwoFactorEnabled } from "@/lib/auth/users";

export async function POST() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const user = await getUserById(sessionUser.id);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (!user.twoFactorEnabled) {
      return NextResponse.json({ ok: true, enabled: false });
    }

    await setTwoFactorEnabled(user.id, false);
    await clearTwoFactorOtp(user.id);

    return NextResponse.json({ ok: true, enabled: false });
  } catch (error) {
    console.error("[auth] 2fa disable failed.", error);
    return NextResponse.json({ error: "Service temporarily unavailable." }, { status: 503 });
  }
}
