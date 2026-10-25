import { NextResponse } from "next/server";
import { authenticator } from "otplib";
import { db } from "@/lib/db";
import { checkPw, startSession, audit } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password, totp } = await req.json();
  const u = await db.user.findUnique({ where: { email: String(email ?? "").toLowerCase() } });
  const bad = NextResponse.json({ error: "Incorrect login details." }, { status: 401 });
  if (!u || u.role !== "ADMIN" || !u.totpSecret) return bad;
  if (u.lockedUntil && u.lockedUntil > new Date()) return NextResponse.json({ error: "Locked. Try later." }, { status: 429 });
  const ok = (await checkPw(u.passwordHash, String(password ?? ""))) && authenticator.check(String(totp ?? ""), u.totpSecret);
  if (!ok) {
    const n = u.failedLogins + 1;
    await db.user.update({ where: { id: u.id }, data: { failedLogins: n, lockedUntil: n >= 3 ? new Date(Date.now() + 30 * 60_000) : null } });
    return bad;
  }
  await db.user.update({ where: { id: u.id }, data: { failedLogins: 0, lockedUntil: null } });
  await startSession(u.id, "ADMIN");
  await audit(u.id, "ADMIN_LOGIN", u.id);
  return NextResponse.json({ ok: true });
}
