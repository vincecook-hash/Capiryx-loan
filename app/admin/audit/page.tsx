"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function AuditPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [err, setErr] = useState("");
  useEffect(() => { api("/api/admin/audit").then(r => (r.ok ? setRows(r.data) : setErr(r.data.error ?? "Could not load"))); }, []);
  return (
    <div className="w">
      <h1>Audit log</h1>
      <p><Link href="/admin">Back to admin</Link></p>
      {err && <div className="msg err">{err}</div>}
      <div style={{ overflowX: "auto" }}>
        <table className="log">
          <thead><tr><th>Time</th><th>Action</th><th>Target</th><th>Admin</th></tr></thead>
          <tbody>{rows.map(r => (
            <tr key={r.id}><td>{new Date(r.createdAt).toLocaleString()}</td><td>{r.action}</td><td>{r.target}</td><td>{String(r.actorId).slice(0, 8)}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
