"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const STEPS = ["SUBMITTED", "UNDER_REVIEW", "OFFERED", "ACCEPTED", "DISBURSED"];
const LABEL: any = { SUBMITTED: "Submitted", UNDER_REVIEW: "Under review", OFFERED: "Offer made", ACCEPTED: "Offer accepted", DISBURSED: "Funds sent", DECLINED: "Declined" };

export default function Dashboard() {
  const [apps, setApps] = useState<any[] | null>(null);
  const [msg, setMsg] = useState("");
  const load = async () => { const r = await api("/api/applications"); setApps(r.ok ? r.data : null); };
  useEffect(() => { load(); }, []);
  if (!apps) return <Auth onDone={load} />;
  return (<div className="w">
    <h1>Your Capiryx dashboard</h1>
    {msg && <div className="msg">{msg}</div>}
    <Kyc setMsg={setMsg} />
    {apps.map(a => <AppCard key={a.id} a={a} setMsg={setMsg} reload={load} />)}
    <Apply setMsg={setMsg} reload={load} />
    {apps.some(a => a.status === "DISBURSED") && <ReviewBox setMsg={setMsg} />}
    <div className="logout-bar"><button className="btn-green" onClick={async () => { await api("/api/auth/logout", "POST"); window.location.href = "/"; }}>Log out</button></div>
  </div>);
}

function Auth({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [sent, setSent] = useState(false);
  const [f, setF] = useState({ contact: "", code: "", password: "" });
  const [note, setNote] = useState<{ t: string; bad: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  const fail = (t: string) => setNote({ t, bad: true });
  function switchTo(m: "login" | "signup" | "reset") { setMode(m); setSent(false); setNote(null); setF({ ...f, code: "", password: "" }); }

  async function go() {
    setNote(null);
    const contact = f.contact.trim().toLowerCase();
    if (contact.length < 5) return fail("Enter your email address.");
    setBusy(true);
    try {
      if (mode === "login") {
        const r = await api("/api/auth/login", "POST", { contact, password: f.password });
        return r.ok ? onDone() : fail(r.data.error ?? "Could not log in.");
      }
      if (!sent) {
        const r = await api("/api/auth/request-code", "POST", { contact, purpose: mode === "signup" ? "SIGNUP" : "RESET" });
        if (!r.ok) return fail(r.data.error ?? "Could not send the code.");
        setSent(true);
        return setNote({ t: "We sent a 6-digit code to " + contact + ". Enter it below" + (mode === "reset" ? " with your new password." : " and choose a password."), bad: false });
      }
      const code = f.code.replace(/\D/g, "");
      if (code.length !== 6) return fail("Enter the 6-digit code from your email.");
      if (f.password.length < 10) return fail("Your password must be at least 10 characters.");
      const r = mode === "signup"
        ? await api("/api/auth/verify-code", "POST", { contact, code, password: f.password })
        : await api("/api/auth/reset", "POST", { contact, code, newPassword: f.password });
      if (!r.ok) return fail(r.data.error ?? "Something went wrong (code " + r.status + ").");
      if (mode === "reset") {
        setMode("login"); setSent(false); setF({ contact: f.contact, code: "", password: "" });
        return setNote({ t: "Password changed. Log in with your new password.", bad: false });
      }
      onDone();
    } finally { setBusy(false); }
  }

  return (<div className="w"><div className="card" style={{ maxWidth: 420, margin: "40px auto" }}>
    <h2>{mode === "login" ? "Log in" : mode === "signup" ? "Create your account" : "Reset your password"}</h2>
    <label>Email address<input type="email" value={f.contact} onChange={set("contact")} disabled={sent} autoComplete="email" /></label>
    {sent && <label>6-digit code<input value={f.code} onChange={set("code")} inputMode="numeric" maxLength={6} autoComplete="one-time-code" /></label>}
    {(mode === "login" || sent) && <label>{mode === "reset" ? "New password" : mode === "signup" ? "Choose a password" : "Password"}{mode !== "login" && <em style={{ fontWeight: 400 }}> (at least 10 characters)</em>}
      <input type="password" value={f.password} onChange={set("password")} autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>}
    {note && <div className={"msg" + (note.bad ? " err" : "")}>{note.t}</div>}
    <button onClick={go} disabled={busy}>{busy ? "Please wait..." : mode === "login" ? "Log in" : sent ? (mode === "reset" ? "Reset password" : "Create account") : "Send code"}</button>
    {sent && <button className="alt" onClick={() => switchTo(mode)}>Start over</button>}
    <p>{mode !== "login"
      ? <a href="#" onClick={e => { e.preventDefault(); switchTo("login"); }}>Back to log in</a>
      : <><a href="#" onClick={e => { e.preventDefault(); switchTo("signup"); }}>Create account</a> · <a href="#" onClick={e => { e.preventDefault(); switchTo("reset"); }}>Forgot password?</a></>}</p>
  </div></div>);
}

function Kyc({ setMsg }: any) {
  const [me, setMe] = useState<any>(null);
  useEffect(() => { api("/api/me").then(r => { if (r.ok) setMe(r.data); }); }, []);
  if (me?.kycStatus === "VERIFIED") return <div className="card"><h3>Identity check</h3><p>Your identity is verified.</p></div>;
  return (<div className="card"><h3>Identity check</h3>
    {me?.kycMode === "persona" ? (<>
      <p>You need a verified identity before you can accept an offer. It takes a few minutes with your ID and a selfie.</p>
      <button onClick={async () => { const r = await api("/api/kyc/start", "POST"); r.ok ? (window.location.href = r.data.url) : setMsg(r.data.error); }}>Verify my identity</button>
    </>) : (
      <p>Our team checks your identity from the ID you upload with your application. Status: <b>{me?.kycStatus === "FAILED" ? "Could not be verified. Please contact us." : "Pending review"}</b>. You can accept an offer once this shows as verified.</p>
    )}</div>);
}

function Apply({ setMsg, reload }: any) {
  const [f, setF] = useState<any>({ country: "", idType: "Passport", supportType: "Business growth" });
  const [file, setFile] = useState<File | null>(null);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  async function submit() {
    if (!file) return setMsg("Choose a photo or PDF of your ID.");
    const fd = new FormData();
    fd.append("file", file);
    const up = await fetch("/api/uploads", { method: "POST", body: fd });
    const uj = await up.json().catch(() => ({}));
    if (!up.ok) return setMsg(uj.error ?? "ID upload failed.");
    const r = await api("/api/applications", "POST", { ...f, idDocKey: uj.key, amountUsd: Number(f.amountUsd) });
    const NAMES: any = { fullName: "full legal name", dob: "date of birth", idNumber: "ID number (at least 4 characters)", phone: "phone (start with + and the country code, e.g. +17585550123)", email: "email address", country: "country", state: "state or district", address: "home address (at least 5 characters)", supportType: "type of support", amountUsd: "amount (at least 500)", description: "reason for funding (at least 20 characters)" };
    setMsg(r.ok ? "Application received. We will notify you as it moves forward." : r.data.fields ? "Please fix: " + Object.keys(r.data.fields).map(k => NAMES[k] ?? k).join("; ") : (r.data.error ?? "Could not submit your application."));
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (r.ok) reload();
  }
  return (<div className="card"><h3>New application</h3>
    <label>Full legal name (as on your ID)<input onChange={set("fullName")} /></label>
    <div className="row"><label>Date of birth<input type="date" onChange={set("dob")} /></label>
      <label>Country<select onChange={set("country")}><option value="">Choose</option><option value="LC">St Lucia</option><option value="MX">Mexico</option></select></label></div>
    <div className="row"><label>ID type<select onChange={set("idType")}><option>Passport</option><option>National ID card</option><option>Driver’s licence</option></select></label>
      <label>ID number<input onChange={set("idNumber")} /></label></div>
    <label>ID photo or PDF<input type="file" accept="image/jpeg,image/png,application/pdf" onChange={e => setFile(e.target.files?.[0] ?? null)} /></label>
    <div className="row"><label>Phone with country code (+1758…)<input onChange={set("phone")} /></label><label>Email (optional)<input onChange={set("email")} /></label></div>
    <div className="row"><label>State or district<input onChange={set("state")} /></label><label>Home address<input onChange={set("address")} /></label></div>
    <div className="row"><label>Type of support<select onChange={set("supportType")}><option>Business growth</option><option>New business start-up</option><option>Home purchase support</option><option>Home repair or improvement</option></select></label>
      <label>Amount (USD)<input type="number" onChange={set("amountUsd")} /></label></div>
    <label>Why do you need funding?<textarea maxLength={600} onChange={set("description")} /></label>
    <button onClick={submit}>Submit application</button></div>);
}

function AppCard({ a, setMsg, reload }: any) {
  const offer = a.offers?.find((o: any) => !o.declinedAt);
  const [bank, setBank] = useState<any>({ country: a.country });
  const [sign, setSign] = useState("");
  const set = (k: string) => (e: any) => setBank({ ...bank, [k]: e.target.value });
  const respond = async (action: string) => {
    const r = await api(`/api/offers/${offer.id}`, "POST", action === "accept" ? { action, signedName: sign, bank } : { action });
    setMsg(r.ok ? "Done." : r.data.error); if (r.ok) reload();
  };
  return (<div className="card"><h3>{a.supportType}: ${a.amountUsd.toLocaleString()} <span className="pill">{LABEL[a.status]}</span></h3>
    <p>{STEPS.map(s => (STEPS.indexOf(s) <= STEPS.indexOf(a.status) ? "● " : "○ ") + LABEL[s]).join("   ")}</p>
    {a.status === "OFFERED" && offer && (<div className="msg">
      <b>Offer from {offer.lender}</b>
      <p>Amount ${offer.amountUsd} · {offer.termMonths} months · {offer.aprPct}% APR · Fee ${offer.feeUsd} (taken from the amount sent, never paid in advance). You receive ${offer.amountUsd - offer.feeUsd}.</p>
      <div className="row"><label>Account holder name<input onChange={set("holderName")} /></label><label>Bank name<input onChange={set("bankName")} /></label>
        <label>Account number<input onChange={set("accountNumber")} /></label><label>Routing or SWIFT code<input onChange={set("routingOrSwift")} /></label></div>
      <label>Sign by typing your full legal name<input value={sign} onChange={e => setSign(e.target.value)} /></label>
      <button onClick={() => respond("accept")}>Accept and sign</button><button className="alt" onClick={() => respond("decline")}>Decline</button></div>)}
    {a.status === "ACCEPTED" && <div className="msg">Offer accepted. The lender is preparing your payment.</div>}
    {a.status === "DECLINED" && a.adminNote && <div className="msg">{a.adminNote}</div>}</div>);
}

function ReviewBox({ setMsg }: any) {
  const [t, setT] = useState("");
  return (<div className="card"><h3>Funded? Share your experience</h3>
    <textarea value={t} onChange={e => setT(e.target.value)} />
    <button onClick={async () => { const r = await api("/api/reviews", "POST", { text: t }); setMsg(r.ok ? "Thank you. It will appear after review." : r.data.error); if (r.ok) setT(""); }}>Send for review</button></div>);
}
