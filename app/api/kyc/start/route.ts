import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST() {
  const s = await getSession();
  if (!s || s.role !== "USER") return NextResponse.json({ error: "Log in first." }, { status: 401 });
  const r = await fetch("https://withpersona.com/api/v1/inquiries", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.KYC_API_KEY}`, "Content-Type": "application/json", "Persona-Version": "2023-01-05" },
    body: JSON.stringify({ data: { attributes: { "inquiry-template-id": process.env.KYC_TEMPLATE_ID, "reference-id": s.userId } } }),
  });
  if (!r.ok) return NextResponse.json({ error: "Identity check is unavailable. Try again later." }, { status: 502 });
  const j = await r.json();
  await db.user.update({ where: { id: s.userId }, data: { kycRef: j.data.id } });
  return NextResponse.json({ inquiryId: j.data.id, url: `https://withpersona.com/verify?inquiry-id=${j.data.id}` });
}
