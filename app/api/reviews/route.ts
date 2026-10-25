import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() { // public: approved only
  const rows = await db.review.findMany({ where: { status: "APPROVED" }, orderBy: { createdAt: "desc" }, take: 50,
    select: { id: true, text: true, createdAt: true } });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "USER") return NextResponse.json({ error: "Log in first." }, { status: 401 });
  const funded = await db.application.count({ where: { userId: s.userId, status: "DISBURSED" } });
  if (!funded) return NextResponse.json({ error: "Reviews are open to funded members." }, { status: 403 });
  const { text } = await req.json();
  if (typeof text !== "string" || text.trim().length < 20 || text.length > 1000)
    return NextResponse.json({ error: "Write 20 to 1000 characters." }, { status: 400 });
  await db.review.create({ data: { userId: s.userId, text: text.trim() } });
  return NextResponse.json({ ok: true }, { status: 201 });
}
