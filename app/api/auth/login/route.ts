import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkPw, startSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { contact, password } = await req.json();
  const c = String(contact ?? "").trim().toLowerCase();
  const user = await db.user.findFirst({ where: c.includes("@") ? { email: c } : { phone: c } });
  const bad = NextResponse.json({ error: "Incorrect login details." }, { status: 401 });
  if (!user || user.role !== "USER") return bad;
  if (user.lockedUntil && user.lockedUntil > new Date())
    return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  if (!(await checkPw(user.passwordHash, String(password ?? "")))) {
    const n = user.failedLogins + 1;
    await db.user.update({ where: { id: user.id }, data: { failedLogins: n % 5 === 0 ? 0 : n,
      lockedUntil: n % 5 === 0 ? new Date(Date.now() + 15 * 60_000) : null } });
    return bad;
  }
  await db.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
  await startSession(user.id, "USER");
  return NextResponse.json({ ok: true });
}
