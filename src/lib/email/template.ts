const LOGO_URL =
  "https://res.cloudinary.com/dqfvrpai8/image/upload/q_auto/f_auto/v1781429056/logo_opnmsj.png";

const BRAND = {
  accent: "#ff3131",
  dark: "#282a2a",
  muted: "#6b6e6e",
  border: "rgba(40, 42, 42, 0.08)",
  surface: "#fafaf9",
  white: "#ffffff",
};

export type EmailTemplateOptions = {
  preheader?: string;
  heading: string;
  intro?: string;
  /** Rendered as label/value rows in a bordered card, e.g. submitted form fields. */
  details?: { label: string; value: string }[];
  bodyHtml?: string;
  cta?: { label: string; href: string };
  footerNote?: string;
};

/** Reusable, brand-consistent HTML email shell used for every transactional email. */
export function renderEmailTemplate({
  preheader,
  heading,
  intro,
  details,
  bodyHtml,
  cta,
  footerNote,
}: EmailTemplateOptions): string {
  const year = new Date().getFullYear();

  const detailsHtml = details?.length
    ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;">
      ${details
        .map(
          (d, i) => `
        <tr>
          <td style="padding:14px 20px;background:${i % 2 === 0 ? BRAND.white : BRAND.surface};border-bottom:${
            i === details.length - 1 ? "none" : `1px solid ${BRAND.border}`
          };">
            <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.muted};font-weight:600;">${escapeHtml(
              d.label,
            )}</div>
            <div style="margin-top:4px;font-size:15px;line-height:1.5;color:${BRAND.dark};white-space:pre-wrap;">${escapeHtml(
              d.value,
            )}</div>
          </td>
        </tr>`,
        )
        .join("")}
    </table>`
    : "";

  const ctaHtml = cta
    ? `
    <div style="margin-top:28px;">
      <a href="${cta.href}" style="display:inline-block;background:${BRAND.accent};color:${BRAND.white};text-decoration:none;font-weight:600;font-size:15px;letter-spacing:-0.01em;padding:14px 28px;border-radius:9999px;">
        ${escapeHtml(cta.label)}
      </a>
    </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(heading)}</title>
  </head>
  <body style="margin:0;padding:0;background:${BRAND.surface};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    ${
      preheader
        ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(
            preheader,
          )}</div>`
        : ""
    }
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.surface};padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom:28px;text-align:center;">
                <img src="${LOGO_URL}" width="140" alt="Draft To Brand" style="display:inline-block;height:auto;" />
              </td>
            </tr>
            <tr>
              <td style="background:${BRAND.dark};border-radius:24px 24px 0 0;padding:36px 32px 28px;">
                <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.5);font-weight:600;">Draft To Brand</div>
                <h1 style="margin:10px 0 0;font-size:26px;line-height:1.15;font-weight:600;letter-spacing:-0.02em;color:${BRAND.white};">${escapeHtml(
                  heading,
                )}</h1>
              </td>
            </tr>
            <tr>
              <td style="background:${BRAND.white};border-radius:0 0 24px 24px;padding:32px;border:1px solid ${BRAND.border};border-top:none;">
                ${
                  intro
                    ? `<p style="margin:0;font-size:16px;line-height:1.6;color:${BRAND.dark};">${escapeHtml(
                        intro,
                      )}</p>`
                    : ""
                }
                ${bodyHtml ?? ""}
                ${detailsHtml}
                ${ctaHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 8px;text-align:center;">
                <p style="margin:0;font-size:12px;color:${BRAND.muted};">
                  ${footerNote ?? `© ${year} Draft To Brand. All rights reserved.`}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
