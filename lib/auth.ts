import { SignJWT, jwtVerify } from "jose";
import { hash as argonHash, verify as argonVerify } from "@node-rs/argon2";
import { cookies } from "next/headers";
import { db } from "./db";

const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET!);
export const hashPw = (p: string) => argonHash(p);
export const checkPw = (h: string, p: string) => argonVerify(h, p);

export async function startSession(userId: string, role: "USER" | "ADMIN") {
  const ttl = role === "ADMIN" ? "2h" : "7d";
  const token = await new SignJWT({ role }).setSubject(userId)
    .setIssuedAt().setExpirationTime(ttl).setProtectedHeader({ alg: "HS256" }).sign(secret());
  cookies().set("cpx_session", token, { httpOnly: true, secure: true, sameSite: "strict", path: "/" });
}

export async function getSession() {
  const t = cookies().get("cpx_session")?.value;
  if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, secret());
    return { userId: payload.sub!, role: payload.role as "USER" | "ADMIN" };
  } catch { return null; }
}

export async function requireAdmin() {
  const s = await getSession();
  if (!s || s.role !== "ADMIN") return null;
  const u = await db.user.findUnique({ where: { id: s.userId } });
  return u?.role === "ADMIN" ? u : null;
}

export const audit = (actorId: string, action: string, target: string, detail?: object) =>
  db.auditLog.create({ data: { actorId, action, target, detail } });
