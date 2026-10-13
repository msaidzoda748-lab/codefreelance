/**
 * Pluggable email. MAIL_PROVIDER = "smtp" | "resend" | (unset → dev log only).
 * Returns { delivered } honestly: false when no provider is configured.
 */
export type MailResult = { delivered: boolean; provider: "smtp" | "resend" | "log" };

export function mailProvider(): MailResult["provider"] {
  const p = (process.env.MAIL_PROVIDER || "").toLowerCase();
  if (p === "smtp" && process.env.SMTP_HOST) return "smtp";
  if (p === "resend" && process.env.RESEND_API_KEY) return "resend";
  return "log";
}

export async function sendMail(to: string, subject: string, text: string, html?: string): Promise<MailResult> {
  const provider = mailProvider();
  const from = process.env.MAIL_FROM || "Zoir Freelance <no-reply@example.com>";
  if (provider === "smtp") {
    const nodemailer = (await import("nodemailer")).default;
    const t = nodemailer.createTransport({
      host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "1",
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    await t.sendMail({ from, to, subject, text, html });
    return { delivered: true, provider };
  }
  if (provider === "resend") {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, text, html }),
    });
    if (!r.ok) throw new Error(`Resend failed: ${r.status}`);
    return { delivered: true, provider };
  }
  // Dev fallback: not delivered — print to server log only.
  console.log(`[mail:log] (NOT SENT — no MAIL_PROVIDER configured) to=${to} subject=${subject}\n${text}`);
  return { delivered: false, provider };
}
