import { NextResponse } from "next/server";
import { z } from "zod";
import { issueCode } from "@/lib/otp";

const Body = z.object({ contact: z.string().trim().min(5).max(120), purpose: z.enum(["SIGNUP", "RESET"]) });

export async function POST(req: Request) {
  const p = Body.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Enter a valid email or phone with country code." }, { status: 400 });
  try { await issueCode(p.data.contact.toLowerCase(), p.data.purpose); }
  catch (e: any) { return NextResponse.json({ error: e.message }, { status: 429 }); }
  // Same response whether or not an account exists, to avoid leaking who is registered.
  return NextResponse.json({ ok: true });
}
