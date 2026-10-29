import Link from "next/link";
import Logo from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="w state">
      <Logo size={64} />
      <h1>We could not find that page</h1>
      <p>The link may be old or mistyped. Here is where you can go next.</p>
      <p><Link className="btn" href="/">Go to the home page</Link> <Link className="btn alt" href="/dashboard">My dashboard</Link></p>
      <p><Link href="/contact">Contact us</Link></p>
    </main>
  );
}
