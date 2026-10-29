import { db } from "./db";
import { checkPw } from "./auth";

// Returns an error message, or null when the password is right. Counts failures and locks after 5.
export async function confirmPassword(userId: string, password: string): Promise<string | null> {
  const u = await db.user.findUnique({ where: { id: userId } });
  if (!u) return "Account not found.";
  if (u.lockedUntil && u.lockedUntil > new Date()) return "Too many attempts. Try again in 15 minutes.";
  if (await checkPw(u.passwordHash, password)) {
    if (u.failedLogins) await db.user.update({ where: { id: u.id }, data: { failedLogins: 0, lockedUntil: null } });
    return null;
  }
  const n = u.failedLogins + 1;
  await db.user.update({ where: { id: u.id }, data: { failedLogins: n % 5 === 0 ? 0 : n, lockedUntil: n % 5 === 0 ? new Date(Date.now() + 15 * 60_000) : null } });
  return "That password is not correct.";
}
