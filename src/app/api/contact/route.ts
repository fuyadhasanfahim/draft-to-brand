import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/contact-schema";
import { renderEmailTemplate } from "@/lib/email/template";
import { sendMail } from "@/lib/email/mailer";
import { siteConfig } from "@/lib/site";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid submission.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { name, email, company, budget, message } = parsed.data;

  const notifyHtml = renderEmailTemplate({
    heading: "New enquiry from the website",
    intro: `${name} just submitted the contact form.`,
    details: [
      { label: "Name", value: name },
      { label: "Email", value: email },
      { label: "Company", value: company || "—" },
      { label: "Monthly budget", value: budget },
      { label: "Message", value: message },
    ],
    cta: { label: "Reply to " + name, href: `mailto:${email}` },
  });

  const confirmationHtml = renderEmailTemplate({
    preheader: "We've received your message and will be in touch shortly.",
    heading: "Message received.",
    intro: `Hi ${name}, thanks for reaching out to Draft To Brand.`,
    bodyHtml: `<p style="margin:16px 0 0;font-size:16px;line-height:1.6;color:#282a2a;">We've received your message and will be in touch with you shortly — usually within one business day.</p>`,
    details: [
      { label: "Monthly budget", value: budget },
      { label: "Your message", value: message },
    ],
    cta: { label: "Book a Discovery Call", href: siteConfig.calendly },
  });

  try {
    await Promise.all([
      sendMail({
        to: siteConfig.email,
        subject: `New enquiry — ${name}${company ? ` (${company})` : ""}`,
        html: notifyHtml,
        replyTo: email,
      }),
      sendMail({
        to: email,
        subject: "We've received your message — Draft To Brand",
        html: confirmationHtml,
      }),
    ]);
  } catch (error) {
    console.error("Failed to send contact email:", error);
    return NextResponse.json(
      { error: "Could not send your message right now. Please try again shortly." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
