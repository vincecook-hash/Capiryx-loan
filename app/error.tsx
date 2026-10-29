"use client";
import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="w state">
      <h1>Something went wrong</h1>
      <p>It is a problem on our side, not yours. Your information is safe. Please try again.</p>
      <p><button onClick={() => reset()}>Try again</button> <Link className="btn alt" href="/">Home page</Link></p>
    </main>
  );
}
