export const metadata = { title: "Contact | Capiryx" };
export default function Page() {
  const mail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "[set NEXT_PUBLIC_CONTACT_EMAIL]";
  return (<main className="w doc"><h1>Contact us</h1>
    <p>Questions about your application, or something that looks like a scam using our name? Write to <b>{mail}</b>.</p>
    <p className="msg">Capiryx staff will never ask you for gift cards, crypto, or payment to release funds. Report anyone who does.</p>
  </main>);
}
