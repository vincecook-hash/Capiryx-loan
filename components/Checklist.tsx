"use client";
import { useState } from "react";
import Link from "next/link";

const ITEMS: [string, string, boolean][] = [
  ["I live in St Lucia or Mexico", "Other countries are not available yet.", true],
  ["I am 18 or older", "You must be an adult to apply.", true],
  ["I have a valid government ID", "A passport, national ID card, or driver’s licence. You will upload a clear photo or PDF.", true],
  ["I have a phone number", "Including the country code, for example +1758… or +52…", true],
  ["I have an email address", "We send your sign-up code and updates there.", true],
  ["I have a bank account in my own name", "Not needed to apply. We only ask for it if you accept an offer.", false],
];

export default function Checklist() {
  const [on, setOn] = useState<boolean[]>(ITEMS.map(() => false));
  const toggle = (i: number) => setOn(on.map((v, k) => (k === i ? !v : v)));
  const missing = ITEMS.filter(([, , req], i) => req && !on[i]).length;
  const ready = missing === 0;
  return (
    <section style={{ paddingTop: 0 }} id="ready"><div className="wrap">
      <div className="readybox">
        <h2>What you need to apply</h2>
        <p className="sec-lead">Tick what you have. It takes a few minutes to apply when you are ready.</p>
        <div className="checkgrid">
          {ITEMS.map(([t, sub, req], i) => (
            <label key={t} className={"checkitem" + (on[i] ? " on" : "")}>
              <input type="checkbox" checked={on[i]} onChange={() => toggle(i)} />
              <span><b>{t}</b>{!req && <em className="later">Needed later</em>}<small>{sub}</small></span>
            </label>
          ))}
        </div>
        {ready ? (
          <div className="readyok"><span>You have everything you need to start.</span><Link className="btn" href="/dashboard">Start your application</Link></div>
        ) : (
          <p className="readynote">{missing === 1 ? "1 more thing to tick" : missing + " more things to tick"} before you apply. You can always <Link href="/contact">contact us</Link> if you are unsure.</p>
        )}
      </div>
    </div></section>
  );
}
