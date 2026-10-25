import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, audit } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const status = new URL(req.url).searchParams.get("status") ?? undefined;
  const rows = await db.application.findMany({ where: status ? { status: status as any } : {}, include: { offers: true }, orderBy: { createdAt: "desc" }, take: 100 });
  await audit(admin.id, "VIEW_APPLICATIONS", "list", { status });
  return NextResponse.json(rows.map(({ idNumberEnc, ...a }) => ({ ...a, idNumberLast4: decrypt(idNumberEnc).slice(-4) })));
}
