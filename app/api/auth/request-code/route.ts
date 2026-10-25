import { NextResponse } from "next/server";
import { z } from "zod";
import { issueCode } from "@/lib/otp";

const Body = z.object({ contact: z.string().trim().min(5).max(120), purpose: z.enum(["SIGNUP", "RESET"]) });

export async function POST(req: Request) {
  const p = Body.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ error: "Enter a valid email or phone with country code." }, { status: 400 });
  try {
    await issueCode(p.data.contact.toLowerCase(), p.data.purpose);
  } catch (e: any) {
    if (String(e?.message).startsWith("Too many")) return NextResponse.json({ error: e.message }, { status: 429 });
    console.error("request-code failed:", e);
    return NextResponse.json({ error: "We could not send your code right now. Please try again shortly." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
