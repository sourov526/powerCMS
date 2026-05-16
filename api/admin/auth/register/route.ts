export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/auth";
import { ensureRootUser } from "@/lib/auth/user";
import { createUser, getUserByEmail } from "@/lib/auth/users";
import { createNotification } from "@/lib/services/notifications";
import { passwordMeetsRequirements } from "@/lib/auth/password";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    if (!passwordMeetsRequirements(password)) {
      return NextResponse.json({ error: "Password does not meet requirements." }, { status: 400 });
    }

    await ensureRootUser();
    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "Email is already registered." }, { status: 400 });
    }

    const created = await createUser({
      email,
      passwordHash: hashPassword(password),
      role: "author",
      status: "pending",
      name,
    });
    if (!created) {
      return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
    }

    await createNotification({
      type: "user_pending",
      title: "New user awaiting approval",
      message: created.email,
      link: "/admin/users",
      recipientRole: "superuser",
      actorId: created.id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[auth] register failed.", error);
    return NextResponse.json({ error: "Service temporarily unavailable." }, { status: 503 });
  }
}
