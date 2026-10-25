import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, audit } from "@/lib/auth";
import { viewUrl } from "@/lib/storage";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const a = await db.application.findUnique({ where: { id: params.id } });
  if (!a) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await audit(admin.id, "VIEW_ID_DOCUMENT", a.id);
  return NextResponse.json({ url: await viewUrl(a.idDocKey) }); // expires in 60 seconds
}
