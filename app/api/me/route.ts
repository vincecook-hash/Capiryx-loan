import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Log in first." }, { status: 401 });
  const u = await db.user.findUnique({ where: { id: s.userId }, select: { kycStatus: true, email: true } });
  return NextResponse.json({ email: u?.email ?? null, kycStatus: u?.kycStatus ?? "PENDING", kycMode: process.env.KYC_API_KEY ? "persona" : "manual" });
}
