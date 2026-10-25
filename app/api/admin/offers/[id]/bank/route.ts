import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, audit } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const o = await db.offer.findUnique({ where: { id: params.id }, include: { bank: true, application: true } });
  if (!o?.bank || o.application.status !== "ACCEPTED") return NextResponse.json({ error: "No accepted offer." }, { status: 404 });
  await audit(admin.id, "VIEW_BANK_DETAILS", o.id);
  return NextResponse.json(JSON.parse(decrypt(o.bank.dataEnc)));
}
