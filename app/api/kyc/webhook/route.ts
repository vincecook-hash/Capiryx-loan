import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("persona-signature") ?? "";
  const t = /t=(\d+)/.exec(sig)?.[1], v1 = /v1=([a-f0-9]+)/.exec(sig)?.[1];
  if (!t || !v1) return NextResponse.json({ error: "bad signature" }, { status: 401 });
  const mac = createHmac("sha256", process.env.KYC_WEBHOOK_SECRET!).update(`${t}.${raw}`).digest("hex");
  if (mac.length !== v1.length || !timingSafeEqual(Buffer.from(mac), Buffer.from(v1)) || Date.now() / 1000 - +t > 300)
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  const ev = JSON.parse(raw)?.data?.attributes;
  const inquiry = ev?.payload?.data;
  const userId = inquiry?.attributes?.["reference-id"];
  const status = inquiry?.attributes?.status; // completed | approved | failed | declined ...
  if (userId && ["approved", "completed"].includes(status)) await db.user.update({ where: { id: userId }, data: { kycStatus: "VERIFIED" } });
  if (userId && ["failed", "declined"].includes(status)) await db.user.update({ where: { id: userId }, data: { kycStatus: "FAILED" } });
  return NextResponse.json({ ok: true });
}
