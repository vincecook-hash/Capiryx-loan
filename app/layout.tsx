import "./globals.css";
const site = (() => { try { return new URL(process.env.APP_URL || "http://localhost:3000"); } catch { return new URL("http://localhost:3000"); } })();

export const metadata = {
  metadataBase: site,
  openGraph: { title: "Capiryx: Making life better", description: "One application for partner loans in St Lucia and Mexico. No fees before you are funded.", siteName: "Capiryx", type: "website" }, title: "Capiryx: Making life better" };
export default function Root({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>
    <div className="warn">Capiryx will never ask you for gift cards, crypto, or any payment before funds are released.</div>
    {children}</body></html>);
}
