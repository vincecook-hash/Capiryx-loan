import Link from "next/link";

const FAQ: [string, string][] = [
  ["Is there a fee to apply?", "No. Creating an account and submitting an application is free."],
  ["Will Capiryx ever ask me to pay before I receive money?", "Never. We do not charge any fee, deposit, “unlock code” or “token” before funds are sent, and we do not accept gift cards or crypto from applicants. If anyone asks you for these, it is a scam, so do not pay and tell us."],
  ["How do fees work?", "A lender may charge a fee. If it does, the fee is shown in your offer before you accept, and it is taken from the amount you receive. You never pay it out of your own pocket first."],
  ["Who decides whether I get funded?", "Our lender partners decide, based on your application. Capiryx collects your application and passes it on. We cannot promise approval."],
  ["How long does it take?", "It depends on the lender and on how complete your application is. Your dashboard shows the current status, and we email you when something changes."],
  ["What do I need to apply?", "A valid government ID (passport, national ID card, or driver’s licence), a phone number, and an email address. You only need a bank account, in your own name, when you accept an offer."],
  ["Which countries can apply?", "St Lucia and Mexico at the moment. Other countries are not available yet."],
  ["Why do you need my ID?", "To confirm you are who you say you are and to protect you and our lenders from fraud. Your ID file is stored privately, and every time our team opens it, the access is recorded."],
  ["When do you ask for my bank details?", "Only after you receive an offer and decide to accept it. They are used to send the funds to an account in your own name."],
  ["Is my information safe?", "ID numbers and bank details are encrypted, and only authorised staff can view them. We do not sell your data. See our Privacy policy for details."],
  ["What if my application is declined?", "You will see the outcome on your dashboard and by email. You can apply again later."],
  ["How do I contact Capiryx?", "Use the Contact page. We never ask for your password or the 6-digit codes we send you."],
];

export default function Faq() {
  return (
    <>
      <section className="tint" id="fees"><div className="wrap">
        <h2>How fees work</h2>
        <p className="sec-lead">No surprises. Here is exactly what you pay, and when.</p>
        <div className="feegrid">
          <div className="feecard"><b>$0</b><span>To apply</span><p>Creating an account and applying is free.</p></div>
          <div className="feecard"><b>$0</b><span>Before funds are released</span><p>We never ask for a fee, deposit, “token”, gift card, or crypto before your money is sent.</p></div>
          <div className="feecard"><b>In your offer</b><span>If a lender fee applies</span><p>It is shown in full before you accept, and taken from the amount you receive.</p></div>
        </div>
        <p className="example"><b>Example:</b> a lender offers $2,000 with a $60 fee. You receive $1,940 in your bank account and pay nothing beforehand.</p>
      </div></section>

      <section id="faq"><div className="wrap faqwrap">
        <div>
          <h2>Frequently asked questions</h2>
          {FAQ.map(([q, a]) => (<details key={q}><summary>{q}</summary><p>{a}</p></details>))}
        </div>
        <aside className="scambox">
          <h3>How to spot a scam</h3>
          <ul>
            <li>Anyone asking you to pay a fee, “unlock code”, or “token” to receive a loan.</li>
            <li>Requests for gift cards, crypto, or wire transfers.</li>
            <li>“Guaranteed approval”, or pressure to act today.</li>
            <li>Offers sent from personal WhatsApp, Telegram, or social media accounts.</li>
            <li>Anyone asking for your password or the 6-digit code we email you.</li>
          </ul>
          <p><b>Real lenders take fees out of the loan, not before it.</b></p>
          <p><Link href="/contact">Report a suspicious message</Link></p>
        </aside>
      </div></section>
    </>
  );
}
