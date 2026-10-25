import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { consumeCode } from "@/lib/otp";
import { hashPw } from "@/lib/auth";

const Body = z.object({ contact: z.string().trim().toLowerCase(), code: z.string().regex(/^\d{6}$/), newPassword: z.string().min(10).max(128) });

export async function POST(req: Request) {
  const p = Body.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Invalid details." }, { status: 400 });
  const { contact, code, newPassword } = p.data;
  if (!(await consumeCode(contact, "RESET", code)))
    return NextResponse.json({ error: "That code is wrong or expired." }, { status: 400 });
  await db.user.updateMany({ where: contact.includes("@") ? { email: contact } : { phone: contact },
    data: { passwordHash: await hashPw(newPassword), failedLogins: 0, lockedUntil: null } });
  return NextResponse.json({ ok: true });
}
