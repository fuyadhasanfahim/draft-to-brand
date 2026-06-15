/**
 * Render-time URL safety guard.
 *
 *   - Returns the URL when it is a syntactically valid http(s):// URL.
 *   - Returns null for everything else: `javascript:`, `data:`, `vbscript:`,
 *     `file:`, `chrome:`, internal schemes, raw fragments, garbage, null.
 *
 * Use this at every JSX site that renders user-controlled URLs into `href`
 * or `src` attributes — defense in depth on top of the Zod validators in
 * `src/lib/validators/*`. Validators can fail to keep up with new fields
 * or be skipped on legacy data; this function makes the final-pixel render
 * safe regardless.
 *
 * Safe by construction: parsing happens via `new URL()` so any URL that
 * parses must have one of the allowed protocols. We don't string-match
 * for ":javascript" tricks — the URL parser handles whitespace, mixed
 * case, percent-encoding, and unicode tricks uniformly.
 */
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

export function isSafeUrl(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (!ALLOWED_PROTOCOLS.has(u.protocol.toLowerCase())) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/**
 * Same as `isSafeUrl` but returns the original string for display when
 * safe (so the host/path renders naturally), null otherwise.
 */
export function safeHref(input: unknown): string | null {
  return isSafeUrl(input);
}
