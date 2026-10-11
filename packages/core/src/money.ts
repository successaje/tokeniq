/**
 * Exact fixed-point arithmetic for financial values.
 *
 * Every monetary value inside TokenIQ is a bigint. Reporting-currency values
 * use 18 decimals ("wad"); on-chain token amounts keep their native decimals
 * until they are converted. Floating point is never used for accounting.
 *
 * Rounding is always explicit. The convention across the engine is:
 *   - requirements (what must be protected) round UP
 *   - availability (what may be deployed or spent) rounds DOWN
 */

export const WAD_DECIMALS = 18;
export const WAD = 10n ** 18n;
export const BPS = 10_000n;

/** A reporting-currency amount with 18 decimals of precision. */
export type Wad = bigint;

/** Basis points: 1 bps = 0.01%. 10_000 bps = 100%. */
export type Bps = bigint;

export type Rounding = "down" | "up";

const DECIMAL_RE = /^(-)?(\d+)(?:\.(\d+))?$/;

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MoneyError";
  }
}

export function pow10(exp: number): bigint {
  if (!Number.isInteger(exp) || exp < 0 || exp > 77) throw new MoneyError(`invalid exponent ${exp}`);
  return 10n ** BigInt(exp);
}

/**
 * Parse a decimal string into an integer scaled by `decimals`.
 * Rejects scientific notation, separators and excess precision unless a rounding mode is given.
 */
export function parseDecimal(input: string, decimals = WAD_DECIMALS, rounding?: Rounding): bigint {
  const trimmed = input.trim();
  const match = DECIMAL_RE.exec(trimmed);
  if (!match) throw new MoneyError(`"${input}" is not a plain decimal number`);
  const [, sign, whole, fracRaw = ""] = match;
  let frac = fracRaw;
  let carry = 0n;
  if (frac.length > decimals) {
    if (!rounding) throw new MoneyError(`"${input}" has more than ${decimals} decimal places`);
    const dropped = frac.slice(decimals);
    frac = frac.slice(0, decimals);
    const hasRemainder = /[1-9]/.test(dropped);
    // Rounding is toward -inf ("down") or +inf ("up"), so the sign matters.
    if (hasRemainder) {
      if (rounding === "up" && !sign) carry = 1n;
      if (rounding === "down" && sign) carry = 1n;
    }
  }
  const magnitude = BigInt(whole!) * pow10(decimals) + BigInt(frac.padEnd(decimals, "0") || "0") + carry;
  return sign ? -magnitude : magnitude;
}

/** Parse a reporting-currency string ("1234.56") into a wad. */
export function wad(input: string | number | bigint): Wad {
  if (typeof input === "bigint") return input * WAD;
  if (typeof input === "number") {
    if (!Number.isSafeInteger(input)) throw new MoneyError("only safe integers may be passed as numbers; use a decimal string");
    return BigInt(input) * WAD;
  }
  return parseDecimal(input, WAD_DECIMALS);
}

export interface FormatOptions {
  /** Maximum fractional digits to show (display rounding is half-up away from zero). */
  maxFractionDigits?: number;
  /** Minimum fractional digits to show (pads with zeros). */
  minFractionDigits?: number;
  /** Insert thousands separators. */
  grouping?: boolean;
}

/** Format a scaled integer as a decimal string without floating point. */
export function formatDecimal(value: bigint, decimals = WAD_DECIMALS, opts: FormatOptions = {}): string {
  const { maxFractionDigits = decimals, minFractionDigits = 0, grouping = false } = opts;
  const negative = value < 0n;
  let magnitude = negative ? -value : value;
  let shownDecimals = decimals;
  if (maxFractionDigits < decimals) {
    const drop = pow10(decimals - maxFractionDigits);
    const remainder = magnitude % drop;
    magnitude = magnitude / drop + (remainder * 2n >= drop ? 1n : 0n);
    shownDecimals = maxFractionDigits;
  }
  const base = pow10(shownDecimals);
  const whole = magnitude / base;
  let frac = shownDecimals > 0 ? (magnitude % base).toString().padStart(shownDecimals, "0") : "";
  frac = frac.replace(/0+$/, "");
  if (frac.length < minFractionDigits) frac = frac.padEnd(minFractionDigits, "0");
  let wholeStr = whole.toString();
  if (grouping) wholeStr = wholeStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const body = frac.length ? `${wholeStr}.${frac}` : wholeStr;
  return negative && magnitude !== 0n ? `-${body}` : body;
}

/** Canonical lossless string form of a wad, e.g. "1234.5". Used for API transport and storage. */
export function wadToString(value: Wad): string {
  return formatDecimal(value, WAD_DECIMALS);
}

/** a * b / d with explicit rounding toward -inf ("down") or +inf ("up"). */
export function mulDiv(a: bigint, b: bigint, d: bigint, rounding: Rounding = "down"): bigint {
  if (d === 0n) throw new MoneyError("division by zero");
  const n = a * b;
  const q = n / d; // truncates toward zero
  const r = n % d;
  if (r === 0n) return q;
  const positive = (n > 0n) === (d > 0n);
  if (rounding === "down") return positive ? q : q - 1n;
  return positive ? q + 1n : q;
}

export function wadMul(a: Wad, b: Wad, rounding: Rounding = "down"): Wad {
  return mulDiv(a, b, WAD, rounding);
}

export function wadDiv(a: Wad, b: Wad, rounding: Rounding = "down"): Wad {
  return mulDiv(a, WAD, b, rounding);
}

/** Apply basis points to an amount: amount * bps / 10_000. */
export function applyBps(amount: bigint, bps: Bps | number, rounding: Rounding = "down"): bigint {
  return mulDiv(amount, BigInt(bps), BPS, rounding);
}

/** a / b expressed in basis points (floored). Returns null when b is zero. */
export function ratioBps(a: bigint, b: bigint): Bps | null {
  if (b === 0n) return null;
  return mulDiv(a, BPS, b, "down");
}

/** Convert a raw token amount with `decimals` into a wad (exact when decimals <= 18). */
export function toWad(raw: bigint, decimals: number, rounding: Rounding = "down"): Wad {
  if (decimals === WAD_DECIMALS) return raw;
  if (decimals < WAD_DECIMALS) return raw * pow10(WAD_DECIMALS - decimals);
  return mulDiv(raw, 1n, pow10(decimals - WAD_DECIMALS), rounding);
}

/** Convert a wad into a raw token amount with `decimals`. */
export function fromWad(value: Wad, decimals: number, rounding: Rounding = "down"): bigint {
  if (decimals === WAD_DECIMALS) return value;
  if (decimals > WAD_DECIMALS) return value * pow10(decimals - WAD_DECIMALS);
  return mulDiv(value, 1n, pow10(WAD_DECIMALS - decimals), rounding);
}

/**
 * Value a raw token balance in the reporting currency.
 * value = raw / 10^tokenDecimals * price / 10^priceDecimals, as a wad.
 */
export function valueOf(raw: bigint, tokenDecimals: number, price: bigint, priceDecimals: number, rounding: Rounding = "down"): Wad {
  return mulDiv(raw * WAD, price, pow10(tokenDecimals + priceDecimals), rounding);
}

export function minOf(...values: bigint[]): bigint {
  if (values.length === 0) throw new MoneyError("minOf requires at least one value");
  return values.reduce((m, v) => (v < m ? v : m));
}

export function maxOf(...values: bigint[]): bigint {
  if (values.length === 0) throw new MoneyError("maxOf requires at least one value");
  return values.reduce((m, v) => (v > m ? v : m));
}

export function sum(values: Iterable<bigint>): bigint {
  let total = 0n;
  for (const v of values) total += v;
  return total;
}

export function clampZero(value: bigint): bigint {
  return value < 0n ? 0n : value;
}

/** Round a wad down to a multiple of `step` (also a wad). Used to propose "clean" amounts. */
export function floorTo(value: Wad, step: Wad): Wad {
  if (step <= 0n) throw new MoneyError("step must be positive");
  return mulDiv(value, 1n, step, "down") * step;
}

export interface UsdFormatOptions {
  /** Fractional digits (default 2). */
  decimals?: number;
  /** Compact notation: $1.25M, $830K. */
  compact?: boolean;
  /** Show a leading + for positive values (for deltas). */
  signed?: boolean;
}

/** Format a wad as US dollars without floating point. */
export function formatUsd(value: Wad, opts: UsdFormatOptions = {}): string {
  const { decimals = 2, compact = false, signed = false } = opts;
  const negative = value < 0n;
  const magnitude = negative ? -value : value;
  let body: string;
  if (compact && magnitude >= 1000n * WAD) {
    const units: Array<[bigint, string]> = [
      [10n ** 12n * WAD, "T"],
      [10n ** 9n * WAD, "B"],
      [10n ** 6n * WAD, "M"],
      [10n ** 3n * WAD, "K"],
    ];
    const [div, suffix] = units.find(([d]) => magnitude >= d)!;
    // Two significant fractional digits for compact display, trimmed.
    const scaled = mulDiv(magnitude, WAD, div, "down");
    body = `${formatDecimal(scaled, WAD_DECIMALS, { maxFractionDigits: magnitude >= div * 100n ? 0 : magnitude >= div * 10n ? 1 : 2 })}${suffix}`;
  } else {
    body = formatDecimal(magnitude, WAD_DECIMALS, { maxFractionDigits: decimals, minFractionDigits: decimals, grouping: true });
  }
  const sign = negative && body.replace(/[^1-9]/g, "") !== "" ? "−" : signed && magnitude > 0n ? "+" : "";
  return `${sign}$${body}`;
}

/** Format basis points as a percentage string, e.g. 512n -> "5.12%". */
export function formatBps(bps: Bps | number, decimals = 2): string {
  const value = BigInt(bps);
  // bps has 2 implied decimals relative to percent.
  return `${formatDecimal(value, 2, { maxFractionDigits: decimals, minFractionDigits: Math.min(decimals, 2) })}%`;
}
