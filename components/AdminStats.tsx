"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const STATUSES = ["SUBMITTED", "UNDER_REVIEW", "OFFERED", "ACCEPTED", "DISBURSED", "DECLINED"];
const LABEL: any = { SUBMITTED: "Submitted", UNDER_REVIEW: "Under review", OFFERED: "Offer made", ACCEPTED: "Accepted", DISBURSED: "Funds sent", DECLINED: "Declined" };
const money = (n: number) => "$" + Math.round(n || 0).toLocaleString("en-US");

export default function AdminStats({ trigger, onPick }: { trigger: unknown; onPick: (s: string) => void }) {
  const [d, setD] = useState<any>(null);
  useEffect(() => { api("/api/admin/stats").then(r => { if (r.ok) setD(r.data); }); }, [trigger]);
  if (!d) return null;
  const c = (s: string) => d.byStatus?.[s]?.count ?? 0;
  const cards: [string, string | number, string, string?][] = [
    ["To review", c("SUBMITTED") + c("UNDER_REVIEW"), "Submitted or under review", "SUBMITTED"],
    ["Awaiting payout", c("ACCEPTED"), "Offer accepted, funds not yet sent", "ACCEPTED"],
    ["Offers out", c("OFFERED"), "Waiting for the applicant", "OFFERED"],
    ["Funded", c("DISBURSED"), money(d.fundedAmount) + " sent in total", "DISBURSED"],
    ["Total requested", money(d.totalRequested), d.total + " applications"],
    ["New this week", d.newThisWeek, "Applications in the last 7 days"],
    ["Identity checks pending", d.kycPending, "Applicants not yet verified"],
    ["Reviews to approve", d.reviewsPending, "Waiting for your decision"],
  ];
  return (
    <>
      <div className="stats">
        {cards.map(([t, v, sub, f]) => (
          <div key={t} className={"stat" + (f ? " click" : "")} onClick={f ? () => onPick(f) : undefined}>
            <span>{t}</span><b>{v}</b><small>{sub}</small>
          </div>
        ))}
      </div>
      <div className="chips">
        <button className="chip" onClick={() => onPick("")}>All ({d.total})</button>
        {STATUSES.map(s => <button key={s} className="chip" onClick={() => onPick(s)}>{LABEL[s]} ({c(s)})</button>)}
      </div>
    </>
  );
}
