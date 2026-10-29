"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Logo from "@/components/Logo";

const STEPS = ["SUBMITTED", "UNDER_REVIEW", "OFFERED", "ACCEPTED", "DISBURSED"];
const LABEL: any = { SUBMITTED: "Submitted", UNDER_REVIEW: "Under review", OFFERED: "Offer made", ACCEPTED: "Offer accepted", DISBURSED: "Funds sent", DECLINED: "Declined" };

export default function Dashboard() {
  const [apps, setApps] = useState<any[] | null>(null);
  const [msg, setMsg] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const load = async () => { const r = await api("/api/applications"); setApps(r.ok ? r.data : null); setOpenForm(false); };
  useEffect(() => { load(); }, []);
  if (!apps) return <Auth onDone={load} />;
  const hasActive = apps.some(a => !["DECLINED", "DISBURSED"].includes(a.status));
  const showForm = !hasActive && (apps.length === 0 || openForm);
  return (<>
    <div className="dash-hero"><div className="dash-hero-in">
      <div className="brand-row"><Logo size={52} /><div><h1>Capiryx</h1><p>Making life better</p></div></div>
    </div></div>
    <div className="w">
      {msg && <div className="msg">{msg}</div>}
      <Kyc setMsg={setMsg} />
      {apps.map(a => <AppCard key={a.id} a={a} setMsg={setMsg} reload={load} />)}
      {!hasActive && apps.length > 0 && !openForm && (
        <div className="card center"><p>Need more funding?</p><button onClick={() => setOpenForm(true)}>Start a new application</button></div>)}
      {showForm && <Apply setMsg={setMsg} reload={load} />}
      {apps.some(a => a.status === "DISBURSED") && <ReviewBox setMsg={setMsg} />}
      <div className="logout-bar"><a className="settings-link" href="/account">Account settings</a><button className="btn-green" onClick={async () => { await api("/api/auth/logout", "POST"); window.location.href = "/"; }}>Log out</button></div>
    </div>
  </>);
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

const DIAL: any = { LC: "+1758", MX: "+52" };
const EMPTY = { fullName: "", dob: "", country: "", idType: "Passport", idNumber: "", phone: "", email: "", state: "", address: "", supportType: "Business growth", amountUsd: "", description: "", consent: false };
const WSTEPS = ["About you", "ID and contact", "Funding", "Review"];
const FIELD_NAMES: any = { fullName: "full legal name", dob: "date of birth", idNumber: "ID number", phone: "phone (start with + and the country code)", email: "email address", country: "country", state: "state or district", address: "home address", supportType: "type of support", amountUsd: "amount (at least 500)", description: "reason for funding (at least 20 characters)" };

function Fld({ label, err, hint, children }: any) {
  return (<label className={err ? "has-err" : ""}>{label}{children}{hint && !err && <small className="hint">{hint}</small>}{err && <small className="ferr">{err}</small>}</label>);
}

function Apply({ setMsg, reload }: any) {
  const [step, setStep] = useState(0);
  const [f, setF] = useState<any>(EMPTY);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [errs, setErrs] = useState<any>({});
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: any) => { setF({ ...f, [k]: e.target.value }); if (errs[k]) setErrs({ ...errs, [k]: "" }); };
  const cleanPhone = (v: string) => v.replace(/[\s\-().]/g, "");

  useEffect(() => {
    if (file && file.type.startsWith("image/")) {
      const u = URL.createObjectURL(file);
      setPreview(u);
      return () => URL.revokeObjectURL(u);
    }
    setPreview("");
  }, [file]);

  function check(n: number) {
    const e: any = {};
    if (n === 0) {
      if (f.fullName.trim().length < 3 || !f.fullName.trim().includes(" ")) e.fullName = "Enter your first and last name as shown on your ID.";
      const d = new Date(f.dob);
      if (!f.dob || isNaN(d.getTime())) e.dob = "Choose your date of birth.";
      else {
        const age = (Date.now() - d.getTime()) / 31557600000;
        if (age < 18) e.dob = "You must be at least 18 to apply.";
        else if (age > 110) e.dob = "Please check the date of birth.";
      }
      if (!f.country) e.country = "Choose your country.";
    }
    if (n === 1) {
      if (f.idNumber.trim().length < 4) e.idNumber = "Enter your ID number.";
      if (!file) e.file = "Choose a photo or PDF of your ID.";
      else if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) e.file = "Use a JPG, PNG, or PDF.";
      else if (file.size > 4 * 1024 * 1024) e.file = "That file is too large. Use one under 4 MB.";
      if (!/^\+\d{7,15}$/.test(cleanPhone(f.phone))) e.phone = "Start with + and your country code, for example " + (DIAL[f.country] ?? "+1758") + "5550123.";
      if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) e.email = "Check the email address.";
      if (f.state.trim().length < 2) e.state = "Enter your state or district.";
      if (f.address.trim().length < 5) e.address = "Enter your home address.";
    }
    if (n === 2) {
      const a = Number(f.amountUsd);
      if (!Number.isInteger(a) || a < 500) e.amountUsd = "Enter a whole amount of at least 500.";
      if (f.description.trim().length < 20) e.description = "Please write at least 20 characters.";
    }
    return e;
  }
  const top = () => document.getElementById("apply-top")?.scrollIntoView({ behavior: "smooth" });
  function next() { const e = check(step); setErrs(e); if (Object.keys(e).length) return; setStep(step + 1); top(); }
  function back() { setErrs({}); setStep(step - 1); top(); }

  async function submit() {
    for (const n of [0, 1, 2]) {
      const e = check(n);
      if (Object.keys(e).length) { setErrs(e); setStep(n); return setMsg("Please fix the highlighted fields."); }
    }
    if (!f.consent) return setErrs({ consent: "Please confirm to continue." });
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file!);
      const up = await fetch("/api/uploads", { method: "POST", body: fd });
      const uj = await up.json().catch(() => ({}));
      if (!up.ok) return setMsg(uj.error ?? "ID upload failed.");
      const r = await api("/api/applications", "POST", {
        fullName: f.fullName.trim(), dob: f.dob, idType: f.idType, idNumber: f.idNumber.trim(), idDocKey: uj.key,
        phone: cleanPhone(f.phone), email: f.email.trim(), country: f.country, state: f.state.trim(), address: f.address.trim(),
        supportType: f.supportType, amountUsd: Number(f.amountUsd), description: f.description.trim(),
      });
      if (r.ok) { setMsg("Application received. We will notify you as it moves forward."); reload(); }
      else setMsg(r.data.fields ? "Please fix: " + Object.keys(r.data.fields).map(k => FIELD_NAMES[k] ?? k).join("; ") : (r.data.error ?? "Could not submit your application."));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally { setBusy(false); }
  }

  return (<div className="card" id="apply-top">
    <h3>New application</h3>
    <div className="wiz">{WSTEPS.map((t, i) => (
      <div key={t} className={"wstep" + (i < step ? " done" : i === step ? " now" : "")}><i>{i < step ? "\u2713" : i + 1}</i><span>{t}</span></div>))}</div>
    <div className="wbar"><div style={{ width: ((step + 1) / WSTEPS.length) * 100 + "%" }} /></div>

    {step === 0 && (<>
      <Fld label="Full legal name (as on your ID)" err={errs.fullName}><input value={f.fullName} onChange={set("fullName")} autoComplete="name" /></Fld>
      <div className="row">
        <Fld label="Date of birth" err={errs.dob}><input type="date" value={f.dob} onChange={set("dob")} /></Fld>
        <Fld label="Country" err={errs.country}><select value={f.country} onChange={set("country")}><option value="">Choose</option><option value="LC">St Lucia</option><option value="MX">Mexico</option></select></Fld>
      </div>
    </>)}

    {step === 1 && (<>
      <div className="row">
        <Fld label="ID type"><select value={f.idType} onChange={set("idType")}><option>Passport</option><option>National ID card</option><option>Driver’s licence</option></select></Fld>
        <Fld label="ID number" err={errs.idNumber}><input value={f.idNumber} onChange={set("idNumber")} /></Fld>
      </div>
      <Fld label="ID photo or PDF" err={errs.file} hint="JPG, PNG or PDF, up to 4 MB. Show all four corners and make sure the text is readable.">
        <input type="file" accept="image/jpeg,image/png,application/pdf" onChange={e => { setFile(e.target.files?.[0] ?? null); setErrs({ ...errs, file: "" }); }} />
      </Fld>
      {file && (<div className="preview">
        {preview ? <img src={preview} alt="Preview of your ID" /> : <div className="pdfbox">PDF selected</div>}
        <small>{file.name} ({Math.max(1, Math.round(file.size / 1024))} KB)</small></div>)}
      <div className="row">
        <Fld label="Phone with country code" err={errs.phone} hint={"Example: " + (DIAL[f.country] ?? "+1758") + "5550123"}><input type="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" /></Fld>
        <Fld label="Email (optional)" err={errs.email}><input type="email" value={f.email} onChange={set("email")} autoComplete="email" /></Fld>
      </div>
      <div className="row">
        <Fld label="State or district" err={errs.state}><input value={f.state} onChange={set("state")} /></Fld>
        <Fld label="Home address" err={errs.address}><input value={f.address} onChange={set("address")} autoComplete="street-address" /></Fld>
      </div>
    </>)}

    {step === 2 && (<>
      <div className="row">
        <Fld label="Type of support"><select value={f.supportType} onChange={set("supportType")}><option>Business growth</option><option>New business start-up</option><option>Home purchase support</option><option>Home repair or improvement</option></select></Fld>
        <Fld label="Amount needed (USD)" err={errs.amountUsd} hint="Whole dollars, at least 500."><input type="number" min={500} value={f.amountUsd} onChange={set("amountUsd")} /></Fld>
      </div>
      <Fld label="Why do you need funding?" err={errs.description} hint={f.description.length + " / 600 characters (at least 20)"}><textarea maxLength={600} value={f.description} onChange={set("description")} /></Fld>
    </>)}

    {step === 3 && (<>
      <p className="msg">Check your details. You can go back to change anything. There is no fee to apply.</p>
      <dl className="facts">
        <div><dt>Name</dt><dd>{f.fullName}</dd></div>
        <div><dt>Date of birth</dt><dd>{f.dob}</dd></div>
        <div><dt>Country</dt><dd>{f.country === "LC" ? "St Lucia" : "Mexico"}</dd></div>
        <div><dt>ID</dt><dd>{f.idType}, {f.idNumber}</dd></div>
        <div><dt>ID file</dt><dd>{file?.name}</dd></div>
        <div><dt>Phone</dt><dd>{cleanPhone(f.phone)}</dd></div>
        <div><dt>State or district</dt><dd>{f.state}</dd></div>
        <div className="wide"><dt>Address</dt><dd>{f.address}</dd></div>
        <div><dt>Type of support</dt><dd>{f.supportType}</dd></div>
        <div><dt>Amount</dt><dd>${Number(f.amountUsd).toLocaleString()}</dd></div>
        <div className="wide"><dt>Reason</dt><dd>{f.description}</dd></div>
      </dl>
      <label className="consent"><input type="checkbox" checked={f.consent} onChange={e => { setF({ ...f, consent: e.target.checked }); setErrs({}); }} /> I confirm the information is true and I agree to the <a href="/terms" target="_blank">Terms</a> and <a href="/privacy" target="_blank">Privacy policy</a>.</label>
      {errs.consent && <small className="ferr">{errs.consent}</small>}
    </>)}

    <div className="nav-row">
      {step > 0 && <button className="alt" onClick={back} disabled={busy}>Back</button>}
      {step < 3 ? <button onClick={next}>Continue</button> : <button onClick={submit} disabled={busy}>{busy ? "Submitting..." : "Submit application"}</button>}
    </div>
  </div>);
}

const STEP_NOTE: any = {
  SUBMITTED: "We have your application. A reviewer will check it and your ID, and you will get an email when anything changes.",
  UNDER_REVIEW: "Your application is being reviewed. This can take a few days.",
  OFFERED: "You have an offer. Read the terms below, then accept or decline.",
  ACCEPTED: "You accepted the offer. The lender is preparing your payment.",
  DISBURSED: "Your funds have been sent. Please check your bank account.",
  DECLINED: "This application did not go ahead.",
};
const COUNTRY: any = { LC: "St Lucia", MX: "Mexico" };

function AppCard({ a, setMsg, reload }: any) {
  const offer = a.offers?.find((o: any) => !o.declinedAt);
  const [bank, setBank] = useState<any>({ country: a.country });
  const [sign, setSign] = useState("");
  const set = (k: string) => (e: any) => setBank({ ...bank, [k]: e.target.value });
  const respond = async (action: string) => {
    const r = await api(`/api/offers/${offer.id}`, "POST", action === "accept" ? { action, signedName: sign, bank } : { action });
    setMsg(r.ok ? "Done." : r.data.error); window.scrollTo({ top: 0, behavior: "smooth" }); if (r.ok) reload();
  };
  const idx = STEPS.indexOf(a.status);
  const date = new Date(a.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  return (<div className="card app">
    <div className="app-head">
      <div><span className="eyebrow">Application {String(a.id).slice(-8).toUpperCase()}</span><h3>{a.supportType}</h3></div>
      <span className={"badge" + (a.status === "DECLINED" ? " bad" : "")}>{LABEL[a.status]}</span>
    </div>
    {a.status !== "DECLINED" && (<div className="track">{STEPS.map((s, i) => (
      <div key={s} className={"tstep" + (i < idx ? " done" : i === idx ? " now" : "")}><i>{i < idx ? "\u2713" : i + 1}</i><span>{LABEL[s]}</span></div>))}</div>)}
    <p className="next"><b>What happens next:</b> {STEP_NOTE[a.status]}</p>
    <dl className="facts">
      <div><dt>Amount requested</dt><dd>${a.amountUsd.toLocaleString()}</dd></div>
      <div><dt>Submitted</dt><dd>{date}</dd></div>
      <div><dt>Country</dt><dd>{COUNTRY[a.country] ?? a.country}</dd></div>
      <div><dt>State or district</dt><dd>{a.state}</dd></div>
      <div><dt>Phone</dt><dd>{a.phone}</dd></div>
      {a.email && <div><dt>Email</dt><dd>{a.email}</dd></div>}
      <div className="wide"><dt>Address</dt><dd>{a.address}</dd></div>
      <div className="wide"><dt>Your reason</dt><dd>{a.description}</dd></div>
    </dl>
    {a.status === "OFFERED" && offer && (<div className="offer">
      <h4>Offer from {offer.lender}</h4>
      <p>Amount ${offer.amountUsd} &middot; {offer.termMonths} months &middot; {offer.aprPct}% APR &middot; Fee ${offer.feeUsd} (taken from the amount sent, never paid in advance). You receive <b>${offer.amountUsd - offer.feeUsd}</b>.</p>
      <div className="row"><label>Account holder name<input onChange={set("holderName")} /></label><label>Bank name<input onChange={set("bankName")} /></label>
        <label>Account number<input onChange={set("accountNumber")} /></label><label>Routing or SWIFT code<input onChange={set("routingOrSwift")} /></label></div>
      <label>Sign by typing your full legal name<input value={sign} onChange={e => setSign(e.target.value)} /></label>
      <button onClick={() => respond("accept")}>Accept and sign</button><button className="alt" onClick={() => respond("decline")}>Decline</button></div>)}
    {a.status === "DECLINED" && a.adminNote && <div className="msg">{a.adminNote}</div>}
  </div>);
}

function ReviewBox({ setMsg }: any) {
  const [t, setT] = useState("");
  return (<div className="card"><h3>Funded? Share your experience</h3>
    <textarea value={t} onChange={e => setT(e.target.value)} />
    <button onClick={async () => { const r = await api("/api/reviews", "POST", { text: t }); setMsg(r.ok ? "Thank you. It will appear after review." : r.data.error); if (r.ok) setT(""); }}>Send for review</button></div>);
}
