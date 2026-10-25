// Email via Resend, SMS via Twilio. Without keys (local dev) messages are logged instead.
export async function sendEmail(to: string, subject: string, text: string) {
  if (!process.env.EMAIL_API_KEY) return console.log("[email]", to, subject, text);
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.EMAIL_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, text }),
  });
  if (!r.ok) console.error("email failed", r.status, await r.text());
}

export async function sendSms(to: string, body: string) {
  const { TWILIO_SID: sid, TWILIO_TOKEN: tok, TWILIO_FROM: from } = process.env;
  if (!sid || !tok) return console.log("[sms]", to, body);
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(`${sid}:${tok}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: to, From: from!, Body: body }),
  });
  if (!r.ok) console.error("sms failed", r.status, await r.text());
}

export const send = (contact: string, subject: string, body: string) =>
  contact.includes("@") ? sendEmail(contact, subject, body) : sendSms(contact, body);
