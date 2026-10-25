"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function Admin() {
  const [apps, setApps] = useState<any[]>([]);
  const [revs, setRevs] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [msg, setMsg] = useState("");
  const [offerFor, setOfferFor] = useState<any>(null);
  const [o, setO] = useState<any>({ lender: "", amountUsd: 0, termMonths: 24, aprPct: 8, feeUsd: 0 });
  const load = async () => {
    const a = await api("/api/admin/applications" + (filter ? `?status=${filter}` : "")); if (a.ok) setApps(a.data);
    const r = await api("/api/admin/reviews"); if (r.ok) setRevs(r.data);
  };
  useEffect(() => { load(); }, [filter]);
  const act = async (id: string, body: any) => { const r = await api(`/api/admin/applications/${id}`, "PATCH", body); setMsg(r.ok ? "Updated." : r.data.error); load(); };
  const viewId = async (id: string) => { const r = await api(`/api/admin/documents/${id}`); r.ok ? window.open(r.data.url) : setMsg(r.data.error); };
  const viewBank = async (offerId: string) => { const r = await api(`/api/admin/offers/${offerId}/bank`); setMsg(r.ok ? `Bank: ${r.data.holderName}, ${r.data.bankName}, acct ${r.data.accountNumber}, ${r.data.routingOrSwift}` : r.data.error); };
  return (<div className="w">
    <h1>Capiryx admin</h1>
    {msg && <div className="msg">{msg}</div>}
    <label>Filter<select value={filter} onChange={e => setFilter(e.target.value)}>
      <option value="">All</option>{["SUBMITTED", "UNDER_REVIEW", "OFFERED", "ACCEPTED", "DISBURSED", "DECLINED"].map(s => <option key={s}>{s}</option>)}</select></label>
    {apps.map(a => { const offer = a.offers?.find((x: any) => x.acceptedAt);
      return (<div className="card" key={a.id}>
        <h3>{a.fullName} <span className="pill">{a.status}</span></h3>
        <p>{a.country} · {a.state} · {a.supportType} · ${a.amountUsd.toLocaleString()} · ID {a.idType} …{a.idNumberLast4}<br />{a.phone} {a.email}<br /><i>{a.description}</i></p>
        <button className="alt" onClick={() => viewId(a.id)}>View ID</button>
        {a.status === "SUBMITTED" && <button onClick={() => act(a.id, { action: "review" })}>Start review</button>}
        {["SUBMITTED", "UNDER_REVIEW"].includes(a.status) && <>
          <button onClick={() => { setOfferFor(a.id); setO({ ...o, amountUsd: a.amountUsd }); }}>Make offer</button>
          <button className="alt" onClick={() => { const note = prompt("Reason for declining (shown in the audit log):"); if (note) act(a.id, { action: "reject", note }); }}>Reject</button></>}
        {a.status === "ACCEPTED" && offer && <>
          <button className="alt" onClick={() => viewBank(offer.id)}>View bank details</button>
          <button onClick={() => { const reference = prompt("Payment reference from the lender or escrow (only after the money is actually sent):"); if (reference) act(a.id, { action: "mark_disbursed", reference }); }}>Mark disbursed</button></>}
        {offerFor === a.id && (<div className="msg">
          <div className="row"><label>Lender<input onChange={e => setO({ ...o, lender: e.target.value })} /></label>
            <label>Amount USD<input type="number" value={o.amountUsd} onChange={e => setO({ ...o, amountUsd: +e.target.value })} /></label>
            <label>Term (months)<input type="number" value={o.termMonths} onChange={e => setO({ ...o, termMonths: +e.target.value })} /></label>
            <label>APR %<input type="number" value={o.aprPct} onChange={e => setO({ ...o, aprPct: +e.target.value })} /></label>
            <label>Fee USD (deducted from proceeds)<input type="number" value={o.feeUsd} onChange={e => setO({ ...o, feeUsd: +e.target.value })} /></label></div>
          <button onClick={() => { act(a.id, { action: "offer", ...o }); setOfferFor(null); }}>Send offer</button></div>)}
      </div>); })}
    <h2>Reviews waiting for approval</h2>
    {revs.length === 0 && <p>None.</p>}
    {revs.map(r => (<div className="card" key={r.id}><p>{r.text}</p>
      {["APPROVED", "REJECTED"].map(s => <button key={s} className={s === "REJECTED" ? "alt" : ""} onClick={async () => { await api(`/api/admin/reviews/${r.id}`, "PATCH", { status: s }); load(); }}>{s === "APPROVED" ? "Approve" : "Reject"}</button>)}</div>))}
  </div>);
}
