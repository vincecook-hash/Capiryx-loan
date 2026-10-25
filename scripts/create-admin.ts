// Usage: ADMIN_EMAIL=you@x.com ADMIN_PASSWORD='long password' npm run create-admin
import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";
import { authenticator } from "otplib";
const db = new PrismaClient();
(async () => {
  const email = process.env.ADMIN_EMAIL!.toLowerCase(), pw = process.env.ADMIN_PASSWORD!;
  if (!email || !pw || pw.length < 14) throw new Error("Set ADMIN_EMAIL and a 14+ character ADMIN_PASSWORD");
  const totpSecret = authenticator.generateSecret();
  await db.user.upsert({ where: { email }, update: { passwordHash: await hash(pw), totpSecret, role: "ADMIN" },
    create: { email, passwordHash: await hash(pw), totpSecret, role: "ADMIN" } });
  console.log("Admin ready. Add this to your authenticator app:\n" + authenticator.keyuri(email, "Capiryx", totpSecret));
})().finally(() => db.$disconnect());
