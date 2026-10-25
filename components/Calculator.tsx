"use client";
import { useState } from "react";
const fmt = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
export default function Calculator() {
  const [P, setP] = useState(10000), [n, setN] = useState(24), [apr, setApr] = useState(8);
  const r = apr / 1200, pay = r ? (P * r) / (1 - Math.pow(1 + r, -n)) : P / n;
  return (
    <div className="calc">
      <h3>Estimate your repayment</h3>
      <label htmlFor="a">Amount needed</label>
      <input id="a" type="range" min={1000} max={50000} step={500} value={P} onChange={e => setP(+e.target.value)} />
      <div className="crow"><span>$1,000</span><output>{fmt(P)}</output><span>$50,000</span></div>
      <label htmlFor="m">Repayment period</label>
      <input id="m" type="range" min={6} max={60} step={6} value={n} onChange={e => setN(+e.target.value)} />
      <div className="crow"><span>6 mo</span><output>{n} months</output><span>60 mo</span></div>
      <label htmlFor="r">Example annual rate</label>
      <input id="r" type="range" min={0} max={20} value={apr} onChange={e => setApr(+e.target.value)} />
      <div className="crow"><span>0%</span><output>{apr}%</output><span>20%</span></div>
      <div className="big"><span>Estimated monthly payment</span><b>{fmt(pay)}</b></div>
      <small>Illustration only. Real rates and terms come from the lender in your offer, shown in full before you accept.</small>
    </div>
  );
}
