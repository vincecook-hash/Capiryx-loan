import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const [groups, kycPending, reviewsPending, newThisWeek] = await Promise.all([
    db.application.groupBy({ by: ["status"], _count: { _all: true }, _sum: { amountUsd: true } }),
    db.user.count({ where: { role: "USER", kycStatus: { not: "VERIFIED" }, applications: { some: {} } } }),
    db.review.count({ where: { status: "PENDING" } }),
    db.application.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 86400000) } } }),
  ]);
  const byStatus: Record<string, { count: number; sum: number }> = {};
  let total = 0, totalRequested = 0;
  for (const g of groups) {
    byStatus[g.status] = { count: g._count._all, sum: g._sum.amountUsd ?? 0 };
    total += g._count._all;
    totalRequested += g._sum.amountUsd ?? 0;
  }
  return NextResponse.json({ byStatus, total, totalRequested, fundedAmount: byStatus.DISBURSED?.sum ?? 0, kycPending, reviewsPending, newThisWeek });
}
