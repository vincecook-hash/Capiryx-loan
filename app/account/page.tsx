"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function Account() {
  const [me, setMe] = useState<any>(null);
  const [pending, setPending] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", again: "" });
  const [pwNote, setPwNote] = useState<{ t: string; bad: boolean } | null>(null);
  const [delPw, setDelPw] = useState("");
  const [sure, setSure] = useState(false);
  const [delNote, setDelNote] = useState<{ t: string; bad: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api("/api/me").then(r => { if (r.ok) setMe(r.data); else window.location.href = "/dashboard"; });
    api("/api/account/delete-request").then(r => { if (r.ok) setPending(r.data.pending); });
  }, []);

  async function changePassword() {
    setPwNote(null);
    if (pw.next.length < 10) return setPwNote({ t: "Your new password must be at least 10 characters.", bad: true });
    if (pw.next !== pw.again) return setPwNote({ t: "The two new passwords do not match.", bad: true });
    setBusy(true);
    const r = await api("/api/account/password", "POST", { currentPassword: pw.current, newPassword: pw.next });
    setBusy(false);
    if (!r.ok) return setPwNote({ t: r.data.error ?? "Could not change the password.", bad: true });
    setPw({ current: "", next: "", again: "" });
    setPwNote({ t: "Password changed. We also sent you an email about it.", bad: false });
  }

  async function requestDeletion() {
    setDelNote(null);
    if (!sure) return setDelNote({ t: "Tick the box to confirm you understand.", bad: true });
    setBusy(true);
    const r = await api("/api/account/delete-request", "POST", { password: delPw });
    setBusy(false);
    if (!r.ok) return setDelNote({ t: r.data.error ?? "Could not send the request.", bad: true });
    setPending(true); setDelPw("");
  }

  if (!me) return <div className="w"><p>Loading...</p></div>;
  return (
    <div className="w">
      <p><Link href="/dashboard">&larr; Back to dashboard</Link></p>
      <h1>Account settings</h1>

      <div className="card">
        <h3>Your account</h3>
        <dl className="facts"><div><dt>Email</dt><dd>{me.email ?? "Not set"}</dd></div>
          <div><dt>Identity check</dt><dd>{me.kycStatus === "VERIFIED" ? "Verified" : me.kycStatus === "FAILED" ? "Could not be verified" : "Pending"}</dd></div></dl>
      </div>

      <div className="card">
        <h3>Change password</h3>
        <label>Current password<input type="password" value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" /></label>
        <label>New password <em style={{ fontWeight: 400 }}>(at least 10 characters)</em><input type="password" value={pw.next} onChange={e => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" /></label>
        <label>Repeat new password<input type="password" value={pw.again} onChange={e => setPw({ ...pw, again: e.target.value })} autoComplete="new-password" /></label>
        {pwNote && <div className={"msg" + (pwNote.bad ? " err" : "")}>{pwNote.t}</div>}
        <button onClick={changePassword} disabled={busy}>Change password</button>
      </div>

      <div className="card danger">
        <h3>Delete my data</h3>
        {pending ? (
          <div className="msg">We received your request. Our team will review it and reply by email. Some records may have to be kept by law.</div>
        ) : (<>
          <p>You can ask us to delete your account and the information we hold about you. Some records, for example about a loan, may have to be kept for legal reasons, and we will tell you what can be removed. Applications that are still active will be closed.</p>
          <label>Confirm with your password<input type="password" value={delPw} onChange={e => setDelPw(e.target.value)} autoComplete="current-password" /></label>
          <label className="consent"><input type="checkbox" checked={sure} onChange={e => setSure(e.target.checked)} /> I understand and want to send a deletion request.</label>
          {delNote && <div className={"msg" + (delNote.bad ? " err" : "")}>{delNote.t}</div>}
          <button className="btn-danger" onClick={requestDeletion} disabled={busy}>Request deletion</button>
        </>)}
      </div>
    </div>
  );
}
