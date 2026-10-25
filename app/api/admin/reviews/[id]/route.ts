import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, audit } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { status } = await req.json();
  if (!["APPROVED", "REJECTED"].includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  await db.review.update({ where: { id: params.id }, data: { status } });
  await audit(admin.id, "REVIEW_" + status, params.id);
  return NextResponse.json({ ok: true });
}
