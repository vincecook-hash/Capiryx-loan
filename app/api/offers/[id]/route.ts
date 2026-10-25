import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";
import { send } from "@/lib/notify";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("decline") }),
  z.object({ action: z.literal("accept"), signedName: z.string().trim().min(3),
    bank: z.object({ holderName: z.string().trim().min(3), bankName: z.string().trim().min(2),
      accountNumber: z.string().trim().min(5).max(40), routingOrSwift: z.string().trim().min(4).max(20),
      country: z.enum(["LC", "MX"]) }) }),
]);

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s || s.role !== "USER") return NextResponse.json({ error: "Log in first." }, { status: 401 });
  const p = Body.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Check the details and try again." }, { status: 400 });
  const offer = await db.offer.findUnique({ where: { id: params.id }, include: { application: true } });
  if (!offer || offer.application.userId !== s.userId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (offer.application.status !== "OFFERED" || offer.acceptedAt || offer.declinedAt)
    return NextResponse.json({ error: "This offer is no longer open." }, { status: 409 });
  const user = await db.user.findUnique({ where: { id: s.userId } });
  const to = offer.application.email ?? offer.application.phone;

  if (p.data.action === "decline") {
    await db.offer.update({ where: { id: offer.id }, data: { declinedAt: new Date() } });
    await db.application.update({ where: { id: offer.applicationId }, data: { status: "DECLINED", adminNote: "Applicant declined the offer" } });
    return NextResponse.json({ ok: true });
  }
  if (user?.kycStatus !== "VERIFIED") return NextResponse.json({ error: "Verify your identity first." }, { status: 403 });
  if (p.data.signedName.toLowerCase() !== offer.application.fullName.toLowerCase())
    return NextResponse.json({ error: "Type your full legal name exactly as on your application to sign." }, { status: 400 });
  if (p.data.bank.holderName.toLowerCase() !== offer.application.fullName.toLowerCase())
    return NextResponse.json({ error: "The bank account must be in your own name." }, { status: 400 });

  await db.$transaction([
    db.bankAccount.create({ data: { offerId: offer.id, dataEnc: encrypt(JSON.stringify(p.data.bank)) } }),
    db.offer.update({ where: { id: offer.id }, data: { acceptedAt: new Date(), signedName: p.data.signedName } }),
    db.application.update({ where: { id: offer.applicationId }, data: { status: "ACCEPTED" } }),
  ]);
  await send(to, "Offer accepted", `We received your signed acceptance. ${offer.lender} will send $${offer.amountUsd - offer.feeUsd} to your bank account. We will tell you when it is sent.`);
  return NextResponse.json({ ok: true });
}
