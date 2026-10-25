import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSession } from "@/lib/auth";
import { ALLOWED, uploadUrl } from "@/lib/storage";

export async function POST(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "USER") return NextResponse.json({ error: "Log in first." }, { status: 401 });
  const { type } = await req.json();
  if (!ALLOWED.includes(type)) return NextResponse.json({ error: "Upload a JPG, PNG, or PDF." }, { status: 400 });
  const key = `ids/${s.userId}/${randomUUID()}`;
  return NextResponse.json({ key, url: await uploadUrl(key, type) });
}
