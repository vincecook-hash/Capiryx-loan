import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, audit } from "@/lib/auth";
import { confirmPassword } from "@/lib/account";
import { send, notifyAdmin } from "@/lib/notify";

export async function GET() {
  const s = await getSession();
  if (!s || s.role !== "USER") return NextResponse.json({ error: "Log in first." }, { status: 401 });
  const found = await db.auditLog.findFirst({ where: { actorId: s.userId, action: "DELETION_REQUEST" } });
  return NextResponse.json({ pending: !!found });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "USER") return NextResponse.json({ error: "Log in first." }, { status: 401 });
  const { password } = await req.json().catch(() => ({ password: "" }));
  const bad = await confirmPassword(s.userId, String(password ?? ""));
  if (bad) return NextResponse.json({ error: bad }, { status: 400 });
  const already = await db.auditLog.findFirst({ where: { actorId: s.userId, action: "DELETION_REQUEST" } });
  if (!already) {
    await audit(s.userId, "DELETION_REQUEST", s.userId);
    const u = await db.user.findUnique({ where: { id: s.userId } });
    if (u?.email) await send(u.email, "We received your data deletion request", "We received your request to delete your Capiryx data.\n\nOur team will review it and reply by email. Some records, for example about a loan, may have to be kept for legal reasons. We will tell you what can be removed.\n\nIf you did not make this request, contact us straight away.");
    await notifyAdmin("Data deletion request", `User ${s.userId} (${u?.email ?? "no email"}) asked for their data to be deleted.\n\nCheck any active applications, then remove or anonymise their records as the law allows. The request is also in the audit log.`);
  }
  return NextResponse.json({ ok: true });
}
