// Email via Resend, SMS via Twilio. Sending never throws, so a mail problem cannot break a request.
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function wrapHtml(text: string) {
  const body = esc(text)
    .replace(/(https?:\/\/[^\s<]*[^\s<.,;:!?])/g, '<a href="$1" style="color:#0b6769">$1</a>')
    .split(/\n{2,}/)
    .map(p => `<p style="margin:0 0 14px">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
  return `<div style="background:#f3f7f8;padding:24px 12px;font-family:Arial,Helvetica,sans-serif"><div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #d3dfe4"><div style="background:#0e2a47;color:#ffffff;padding:18px 24px"><b style="font-size:22px">Capiryx</b><div style="color:#e3a72f;font-size:13px">Making life better</div></div><div style="padding:24px;color:#1c2b3a;font-size:15px;line-height:1.55">${body}</div><div style="background:#fff6dd;color:#5c4300;padding:12px 24px;font-size:12px">Capiryx will never ask you for gift cards, crypto, your password, or any payment before funds are released.</div></div></div>`;
}

export async function sendEmail(to: string, subject: string, text: string) {
  try {
    if (process.env.NODE_ENV !== "production") console.log("[dev] email to", to, "|", subject, "\n" + text);
    if (!process.env.EMAIL_API_KEY) return;
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.EMAIL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, text, html: wrapHtml(text) }),
    });
    if (!r.ok) console.error("email failed", r.status, await r.text());
  } catch (e) { console.error("email error", e); }
}

export async function sendSms(to: string, body: string) {
  try {
    if (process.env.NODE_ENV !== "production") console.log("[dev] sms to", to, "|", body);
    const { TWILIO_SID: sid, TWILIO_TOKEN: tok, TWILIO_FROM: from } = process.env;
    if (!sid || !tok) return;
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: { Authorization: "Basic " + Buffer.from(`${sid}:${tok}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ To: to, From: from!, Body: body }),
    });
    if (!r.ok) console.error("sms failed", r.status, await r.text());
  } catch (e) { console.error("sms error", e); }
}

export const send = (contact: string, subject: string, body: string) =>
  contact.includes("@") ? sendEmail(contact, subject, body) : sendSms(contact, body);

// Alerts to you, the admin. Set ADMIN_NOTIFY_EMAIL in .env.
export const notifyAdmin = (subject: string, body: string) =>
  process.env.ADMIN_NOTIFY_EMAIL ? sendEmail(process.env.ADMIN_NOTIFY_EMAIL, "[Capiryx admin] " + subject, body) : Promise.resolve();
