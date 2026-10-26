import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSession } from "@/lib/auth";
import { ALLOWED, MAX_BYTES, looksValid, saveId } from "@/lib/storage";

export async function POST(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "USER") return NextResponse.json({ error: "Log in first." }, { status: 401 });
  const file = (await req.formData().catch(() => null))?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file." }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "Upload a JPG, PNG, or PDF." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File is too large. Use under 4 MB." }, { status: 400 });
  const buf = Buffer.from(await file.arrayBuffer());
  if (!looksValid(buf, file.type)) return NextResponse.json({ error: "That file does not look like a valid image or PDF." }, { status: 400 });
  const key = `ids/${s.userId}/${randomUUID()}`;
  try { await saveId(key, buf, file.type); }
  catch (e) { console.error("upload failed:", e); return NextResponse.json({ error: "Upload failed. Try again." }, { status: 500 }); }
  return NextResponse.json({ key });
}
