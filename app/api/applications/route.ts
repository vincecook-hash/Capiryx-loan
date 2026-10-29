import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";
import { send, notifyAdmin } from "@/lib/notify";

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
  if (Date.now() - p.data.dob.getTime() < 18 * 31557600000) return NextResponse.json({ error: "You must be at least 18 to apply." }, { status: 400 });
  if (!p.data.idDocKey.startsWith(`ids/${s.userId}/`)) return NextResponse.json({ error: "Upload your ID again." }, { status: 400 });
  const { idNumber, email, ...d } = p.data;
  const user = await db.user.findUnique({ where: { id: s.userId } });
  const app = await db.application.create({ data: { ...d, email: email || user?.email || null, userId: s.userId, idNumberEnc: encrypt(idNumber) } });
  const ref = app.id.slice(-8).toUpperCase();
  const base = process.env.APP_URL ?? "";
  const who = app.email ?? app.phone;
  await send(who, `We received your application (Ref ${ref})`,
    `Hello ${app.fullName.split(" ")[0]},\n\nWe received your application for ${app.supportType} of $${app.amountUsd.toLocaleString("en-US")}.\n\nYour reference number is ${ref}. Please quote it if you ever contact us.\n\nWhat happens next: our team reviews your application and your ID. We will email you whenever something changes, and you can follow progress here:\n${base}/dashboard\n\nThere is no fee to apply, and we will never ask you to pay before funds are released.\n\nThe Capiryx team`);
  await notifyAdmin(`New application ${ref}`, `${app.fullName} (${app.country}) applied for ${app.supportType}, $${app.amountUsd.toLocaleString("en-US")}.\n\nReview it here:\n${base}/admin`);
  return NextResponse.json({ id: app.id, status: app.status }, { status: 201 });
}

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Log in first." }, { status: 401 });
  const apps = await db.application.findMany({ where: { userId: s.userId }, include: { offers: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(apps.map(({ idNumberEnc, idDocKey, ...a }) => a));
}
