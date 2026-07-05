import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

export async function sendMail({ to, subject, html, replyTo }: SendMailInput) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!from) {
    throw new Error(
      "SMTP is not configured — set SMTP_HOST, SMTP_USER, SMTP_PASS in your environment.",
    );
  }

  await getTransporter().sendMail({
    from: `"Draft To Brand" <${from}>`,
    to,
    subject,
    html,
    replyTo,
  });
}
