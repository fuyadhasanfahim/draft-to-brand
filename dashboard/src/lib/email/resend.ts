import "server-only";
import { Resend } from "resend";

declare global {
  // eslint-disable-next-line no-var
  var __resend: Resend | undefined;
}

/**
 * Singleton Resend client. Lazy in dev to survive HMR; eager in prod.
 * Throws at first use (not at import) if the API key is missing — so
 * preview tooling and React Email playground can import templates without
 * needing a key locally.
 */
function createClient(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

export const resend: Resend =
  global.__resend ??
  new Proxy({} as Resend, {
    get(_t, prop, receiver) {
      const real = (global.__resend ??= createClient());
      return Reflect.get(real, prop, receiver);
    },
  });
