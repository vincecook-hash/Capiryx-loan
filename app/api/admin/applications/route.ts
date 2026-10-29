import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, audit } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const sp = new URL(req.url).searchParams;
  const status = sp.get("status") ?? undefined;
  const q = (sp.get("q") ?? "").trim().slice(0, 80);
  const rows = await db.application.findMany({ where: { ...(status ? { status: status as any } : {}), ...(q ? { OR: [{ fullName: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }, { state: { contains: q, mode: "insensitive" } }, { id: { endsWith: q.toLowerCase() } }] } : {}) }, include: { offers: true, user: { select: { kycStatus: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
  if (!q) await audit(admin.id, "VIEW_APPLICATIONS", "list", { status });
  return NextResponse.json(rows.map(({ idNumberEnc, ...a }) => ({ ...a, idNumberLast4: decrypt(idNumberEnc).slice(-4) })));
}
