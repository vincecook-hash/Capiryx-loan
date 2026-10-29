import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession, hashPw } from "@/lib/auth";
import { confirmPassword } from "@/lib/account";
import { send } from "@/lib/notify";

const Body = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(10).max(128) });

export async function POST(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "USER") return NextResponse.json({ error: "Log in first." }, { status: 401 });
  const p = Body.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ error: "Your new password must be at least 10 characters." }, { status: 400 });
  if (p.data.currentPassword === p.data.newPassword) return NextResponse.json({ error: "Choose a password you have not used just now." }, { status: 400 });
  const bad = await confirmPassword(s.userId, p.data.currentPassword);
  if (bad) return NextResponse.json({ error: bad.replace("That password", "Your current password") }, { status: 400 });
  const u = await db.user.update({ where: { id: s.userId }, data: { passwordHash: await hashPw(p.data.newPassword) } });
  if (u.email) await send(u.email, "Your Capiryx password was changed", `Your Capiryx password was just changed.\n\nIf this was not you, reset your password straight away from the log-in page and contact us:\n${process.env.APP_URL ?? ""}/contact`);
  return NextResponse.json({ ok: true });
}
