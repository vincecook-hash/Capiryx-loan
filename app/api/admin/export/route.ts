import { db } from "@/lib/db";
import { requireAdmin, audit } from "@/lib/auth";

// Quote every cell and neutralise spreadsheet formulas.
const cell = (v: unknown) => {
  let s = String(v ?? "");
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return new Response("Forbidden", { status: 403 });
  const rows = await db.application.findMany({ orderBy: { createdAt: "desc" } });
  const head = ["id", "created", "name", "country", "state", "type", "amountUsd", "status", "phone", "email", "note"];
  const lines = [head.map(cell).join(",")].concat(rows.map(a =>
    [a.id, a.createdAt.toISOString(), a.fullName, a.country, a.state, a.supportType, a.amountUsd, a.status, a.phone, a.email, a.adminNote].map(cell).join(",")));
  await audit(admin.id, "EXPORT_CSV", "applications", { count: rows.length });
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="applications.csv"' } });
}
