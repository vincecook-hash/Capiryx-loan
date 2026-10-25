import "./globals.css";
export const metadata = { title: "Capiryx: Making life better" };
export default function Root({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>
    <div className="warn">Capiryx will never ask you for gift cards, crypto, or any payment before funds are released.</div>
    {children}</body></html>);
}
