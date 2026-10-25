import { db } from "./db";
import { newCode, hashCode } from "./crypto";
import { send } from "./notify";

export async function issueCode(contact: string, purpose: "SIGNUP" | "RESET") {
  const recent = await db.otpCode.count({
    where: { contact, purpose, expiresAt: { gt: new Date(Date.now() + 5 * 60_000) } },
  });
  if (recent >= 3) throw new Error("Too many requests. Try again in a few minutes.");
  const code = newCode();
  await db.otpCode.create({ data: { contact, purpose, codeHash: hashCode(contact, code),
    expiresAt: new Date(Date.now() + 10 * 60_000) } });
  await send(contact, "Your Capiryx code", `Your code is ${code}. It expires in 10 minutes. Capiryx never asks for payments or gift cards.`);
}

export async function consumeCode(contact: string, purpose: string, code: string) {
  const row = await db.otpCode.findFirst({
    where: { contact, purpose, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: "desc" } });
  if (!row || row.attempts >= 5) return false;
  if (row.codeHash !== hashCode(contact, code)) {
    await db.otpCode.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
    return false;
  }
  await db.otpCode.update({ where: { id: row.id }, data: { usedAt: new Date() } });
  return true;
}
