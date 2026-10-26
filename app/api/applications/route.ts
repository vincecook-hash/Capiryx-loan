import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";

const Body = z.object({
  fullName: z.string().trim().min(3).max(120), dob: z.coerce.date(),
  idType: z.enum(["Passport", "National ID card", "Driver’s licence"]),
  idNumber: z.string().trim().min(4).max(40), idDocKey: z.string().min(1), // key from a private-bucket upload
  phone: z.string().transform(v => v.replace(/[\s\-().]/g, "")).pipe(z.string().regex(/^\+\d{7,15}$/)), email: z.string().email().optional().or(z.literal("")),
  country: z.enum(["LC", "MX"]), // Cuba stays disabled until legal review
  state: z.string().trim().min(2), address: z.string().trim().min(5),
  supportType: z.enum(["Business growth", "New business start-up", "Home purchase support", "Home repair or improvement"]),
  amountUsd: z.number().int().min(500).max(1_000_000), description: z.string().trim().min(20).max(600),
});

export async function POST(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "USER") return NextResponse.json({ error: "Log in first." }, { status: 401 });
  const p = Body.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Some fields are missing or invalid.", fields: p.error.flatten().fieldErrors }, { status: 400 });
  if (!p.data.idDocKey.startsWith(`ids/${s.userId}/`)) return NextResponse.json({ error: "Upload your ID again." }, { status: 400 });
  const { idNumber, email, ...d } = p.data;
  const app = await db.application.create({ data: { ...d, email: email || null, userId: s.userId, idNumberEnc: encrypt(idNumber) } });
  return NextResponse.json({ id: app.id, status: app.status }, { status: 201 });
}

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Log in first." }, { status: 401 });
  const apps = await db.application.findMany({ where: { userId: s.userId }, include: { offers: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(apps.map(({ idNumberEnc, idDocKey, ...a }) => a));
}
