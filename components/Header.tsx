import Link from "next/link";
import Logo from "./Logo";

function Mark() {
  return (
    <svg width="34" height="34" viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#0b6769" />
      <path d="M27 13.5A10 10 0 1 0 27 26.5" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="29" cy="20" r="3.2" fill="#e3a72f" />
    </svg>
  );
}
export default function Header() {
  const links = [["/#tracks", "Funding"], ["/#how", "How it works"], ["/#fees", "Fees"], ["/#faq", "FAQ"], ["/#reviews", "Reviews"], ["/contact", "Contact"]];
  return (
    <header className="site-h"><div className="nav">
      <Link className="logo" href="/"><Logo /><span>Capiryx</span></Link>
      <nav className="desk">
        {links.map(([h, t]) => <Link key={h} href={h}>{t}</Link>)}
        <Link className="btn" href="/dashboard">Apply or log in</Link>
      </nav>
      <details className="mob">
        <summary>Menu</summary>
        <div className="drop">
          {links.map(([h, t]) => <Link key={h} href={h}>{t}</Link>)}
          <Link className="btn" href="/dashboard">Apply or log in</Link>
        </div>
      </details>
    </div></header>
  );
}
