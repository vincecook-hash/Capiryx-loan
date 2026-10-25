"use client";
import { useEffect, useState } from "react";
export default function ReviewCarousel() {
  const [rows, setRows] = useState<{ id: string; text: string }[] | null>(null);
  const [i, setI] = useState(0);
  useEffect(() => { fetch("/api/reviews").then(r => r.json()).then(setRows).catch(() => setRows([])); }, []);
  useEffect(() => {
    if (!rows || rows.length < 2) return;
    const t = setInterval(() => setI(x => (x + 1) % rows.length), 7000);
    return () => clearInterval(t);
  }, [rows]);
  if (!rows) return <div className="empty">Loading reviews…</div>;
  if (!rows.length) return <div className="empty">No reviews yet. We only publish reviews from members who have been funded, and every review is checked by our team before it appears.</div>;
  return (
    <figure className="rev" aria-live="polite">
      <blockquote>{rows[i].text}</blockquote>
      <figcaption>Funded Capiryx member · {i + 1} of {rows.length}</figcaption>
    </figure>
  );
}
