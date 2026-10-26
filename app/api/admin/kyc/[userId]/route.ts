import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, audit } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { userId: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { status } = await req.json();
  if (!["VERIFIED", "FAILED"].includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  await db.user.update({ where: { id: params.userId }, data: { kycStatus: status } });
  await audit(admin.id, "KYC_" + status, params.userId);
  return NextResponse.json({ ok: true });
}
