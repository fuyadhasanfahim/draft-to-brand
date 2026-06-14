/**
 * Send a real transactional email through Resend for end-to-end QA.
 *
 *   tsx scripts/send-test-email.ts <verification|reset|welcome> <to@addr>
 *
 * Requires RESEND_API_KEY in env. With no key, sendEmail() will log to
 * stdout instead of hitting Resend — useful for offline smoke tests.
 */
import "dotenv/config";
import { sendEmail } from "../src/lib/email";
import { EMAIL_SUBJECTS } from "../src/lib/email/email-config";
import {
  PasswordResetEmail,
  VerificationEmail,
  WelcomeEmail,
} from "../src/emails";

type Template = "verification" | "reset" | "welcome";

async function main() {
  const [tplArg, toArg] = process.argv.slice(2);
  const tpl = (tplArg ?? "verification") as Template;
  const to = toArg ?? process.env.RESEND_TEST_TO;

  if (!to) {
    console.error("Usage: tsx scripts/send-test-email.ts <verification|reset|welcome> <to@addr>");
    process.exit(1);
  }

  const previewUrl = "https://drafttobrand.com/preview?token=" + Math.random().toString(36).slice(2);

  const recipes: Record<Template, { subject: string; react: ReturnType<typeof renderForTemplate> }> = {
    verification: {
      subject: EMAIL_SUBJECTS.verification,
      react: VerificationEmail({ name: "Test User", verifyUrl: previewUrl }),
    },
    reset: {
      subject: EMAIL_SUBJECTS.passwordReset,
      react: PasswordResetEmail({ name: "Test User", resetUrl: previewUrl }),
    },
    welcome: {
      subject: EMAIL_SUBJECTS.welcome,
      react: WelcomeEmail({ name: "Test User", workspaceName: "Draft To Brand" }),
    },
  };

  const recipe = recipes[tpl];
  if (!recipe) throw new Error(`Unknown template: ${tpl}`);

  console.log(`→ Sending "${tpl}" to ${to}…`);
  const result = await sendEmail({ to, subject: recipe.subject, react: recipe.react });

  if (result.ok) console.log(`✓ Sent (id: ${result.id})`);
  else {
    console.error(`✗ Failed: ${result.error}`);
    process.exit(1);
  }
}

// Type helper — keeps TS narrow without importing ReactElement here.
function renderForTemplate() {
  return VerificationEmail({ name: "", verifyUrl: "" });
}

main();
