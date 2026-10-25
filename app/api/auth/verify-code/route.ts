import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { consumeCode } from "@/lib/otp";
import { hashPw, startSession } from "@/lib/auth";

const Body = z.object({ contact: z.string().trim().toLowerCase(), code: z.string().regex(/^\d{6}$/), password: z.string().min(10).max(128) });

export async function POST(req: Request) {
  const p = Body.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Check your code and use a password of 10+ characters." }, { status: 400 });
  const { contact, code, password } = p.data;
  if (!(await consumeCode(contact, "SIGNUP", code)))
    return NextResponse.json({ error: "That code is wrong or expired." }, { status: 400 });
  const key = contact.includes("@") ? { email: contact } : { phone: contact };
  if (await db.user.findFirst({ where: key }))
    return NextResponse.json({ error: "An account already exists. Log in instead." }, { status: 409 });
  const user = await db.user.create({ data: { ...key, passwordHash: await hashPw(password) } });
  await startSession(user.id, "USER");
  return NextResponse.json({ ok: true });
}
