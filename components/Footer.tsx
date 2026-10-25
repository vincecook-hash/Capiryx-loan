import Link from "next/link";
export default function Footer() {
  const entity = process.env.NEXT_PUBLIC_LEGAL_ENTITY || "[Set NEXT_PUBLIC_LEGAL_ENTITY to your registered company name, registration number, country, and licences]";
  return (
    <footer className="site-f"><div className="w">
      <b>Capiryx: Making life better</b>
      <p>{entity}</p>
      <p>Capiryx is a platform that introduces applicants to lenders, backers, and programs. Each lender sets its own decisions and terms. Capiryx never charges applicants before funds are released and never accepts gift cards or crypto from applicants.</p>
      <p><Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link> · <Link href="/contact">Contact</Link></p>
    </div></footer>
  );
}
