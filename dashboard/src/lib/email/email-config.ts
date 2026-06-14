import { BRAND } from "@/lib/constants/brand";

/**
 * Centralized email configuration. Read only — never mutate at runtime.
 * Anything related to default headers, throttling policies, or sender
 * identity must flow through this module.
 */
export const EMAIL_CONFIG = {
  from: BRAND.email.from,
  replyTo: BRAND.email.replyTo,
  tags: {
    transactional: (): { name: string; value: string }[] => [
      { name: "category", value: "transactional" },
    ],
  },
} as const;

export const EMAIL_SUBJECTS = {
  verification:  "Verify your email address",
  passwordReset: "Reset your password",
  welcome:       `Welcome to ${BRAND.name}`,
} as const;
