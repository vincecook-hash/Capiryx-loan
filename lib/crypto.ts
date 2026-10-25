import { createCipheriv, createDecipheriv, createHmac, randomBytes, randomInt } from "crypto";
const key = () => Buffer.from(process.env.FIELD_ENCRYPTION_KEY!, "hex");

export function encrypt(plain: string) {
  const iv = randomBytes(12), c = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), enc]).toString("base64");
}
export function decrypt(b64: string) {
  const b = Buffer.from(b64, "base64"), d = createDecipheriv("aes-256-gcm", key(), b.subarray(0, 12));
  d.setAuthTag(b.subarray(12, 28));
  return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString("utf8");
}
export const newCode = () => String(randomInt(0, 1_000_000)).padStart(6, "0");
export const hashCode = (contact: string, code: string) =>
  createHmac("sha256", process.env.OTP_PEPPER!).update(contact + ":" + code).digest("hex");
