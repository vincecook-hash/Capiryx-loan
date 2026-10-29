import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, audit } from "@/lib/auth";
import { send } from "@/lib/notify";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("review") }),
  z.object({ action: z.literal("reject"), note: z.string().min(5) }),
  z.object({ action: z.literal("offer"), lender: z.string().min(2), amountUsd: z.number().int().positive(),
    termMonths: z.number().int().min(3).max(120), aprPct: z.number().min(0).max(60), feeUsd: z.number().int().min(0) }),
  z.object({ action: z.literal("mark_disbursed"), reference: z.string().min(3) }), // after the lender/escrow actually pays
]);

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = Body.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Invalid request", detail: p.error.flatten() }, { status: 400 });
  const a = await db.application.findUnique({ where: { id: params.id } });
  if (!a) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const d = p.data, to = a.email ?? a.phone, link = `${process.env.APP_URL}/dashboard`;

  if (d.action === "review") {
    await db.application.update({ where: { id: a.id }, data: { status: "UNDER_REVIEW" } });
    await send(to, "Your application is under review", `Hello ${a.fullName.split(" ")[0]},\n\nYour application (Ref ${a.id.slice(-8).toUpperCase()}) is now being reviewed. We will email you when there is an update.\n\nYou can follow progress here:\n${link}`);
  }
  if (d.action === "reject") {
    await db.application.update({ where: { id: a.id }, data: { status: "DECLINED", adminNote: d.note } });
    await send(to, "Your Capiryx application", "Thank you for applying. We could not move your application forward this time. Log in to see details.");
  }
  if (d.action === "offer") {
    const { action, ...o } = d;
    await db.offer.create({ data: { ...o, applicationId: a.id } });
    await db.application.update({ where: { id: a.id }, data: { status: "OFFERED" } });
    await send(to, "You have a funding offer", `Good news, ${a.fullName}. ${d.lender} has made you an offer of $${d.amountUsd}. Log in to read the full terms, including any fee, and decide: ${link}. Capiryx never asks for upfront payments, crypto, or gift cards.`);
  }
  if (d.action === "mark_disbursed") {
    if (a.status !== "ACCEPTED") return NextResponse.json({ error: "Only accepted offers can be disbursed." }, { status: 409 });
    await db.application.update({ where: { id: a.id }, data: { status: "DISBURSED" } });
    await send(to, "Funds sent", `Your funds have been sent. Reference: ${d.reference}.`);
  }
  await audit(admin.id, "APPLICATION_" + d.action.toUpperCase(), a.id, d);
  return NextResponse.json({ ok: true });
}
