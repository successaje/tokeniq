/**
 * Small guards for values that arrive from URLs, servers or the clipboard and
 * then drive navigation or money input. Pure, so they are unit-tested directly.
 */

/**
 * Only allow same-origin redirects after sign-in. Prefix checks alone are not
 * enough: URL parsing strips tabs and newlines and treats "\" as "/", so
 * "/<TAB>/evil.example" would resolve to another origin. Resolve, then compare.
 */
export function safeNext(next: string | null, origin = typeof window !== "undefined" ? window.location.origin : "http://localhost"): string {
  if (!next || !next.startsWith("/") || /[\u0000-\u001f\u007f\\]/.test(next)) return "/app";
  try {
    const url = new URL(next, origin);
    if (url.origin !== origin) return "/app";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/app";
  }
}

/** Notification links are server-built, but only ever follow an in-app path (never javascript:, another origin or //host). */
export function isAppPath(link: string): boolean {
  return /^\/app(?:[/?#]|$)/.test(link) && !/[\\\u0000-\u001f\u007f]/.test(link);
}

const DECIMAL_RE = /^\d*(\.\d*)?$/;
/** "1,234,567.89": commas only as thousands separators. */
const GROUPED_RE = /^\d{1,3}(,\d{3})+(\.\d*)?$/;

/**
 * Normalise typed or pasted amount text to a plain decimal string, or null to
 * reject it. Commas are accepted only as thousands separators: "1,5" (a decimal
 * comma in many locales) is rejected rather than silently read as 15.
 */
export function normalizeAmountInput(raw: string, maxDecimals: number): string | null {
  const t = raw.trim();
  const v = t.includes(",") ? (GROUPED_RE.test(t) ? t.replace(/,/g, "") : null) : t;
  if (v === null) return null;
  if (v === "") return "";
  return DECIMAL_RE.test(v) && (v.split(".")[1]?.length ?? 0) <= maxDecimals ? v : null;
}
