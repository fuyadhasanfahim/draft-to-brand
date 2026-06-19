/** Email event/recipient literal unions, kept free of Prisma imports so they
 *  can be shared by client components (matches the codebase convention of
 *  passing plain literal-union props from RSC pages to client islands). */
export type EmailEventType =
  | "SENT"
  | "OPENED"
  | "CLICKED"
  | "REPLIED"
  | "BOUNCED"
  | "FOLLOWUP_SENT";
