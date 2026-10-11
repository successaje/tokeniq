import { parseDecimal, wadToString, type Wad } from "@tokeniq/core";

/** Wad → canonical decimal string for JSON. */
export const s = (v: Wad): string => wadToString(v);
export const sOrNull = (v: Wad | null | undefined): string | null => (v === null || v === undefined ? null : wadToString(v));
/** Bigint (raw token units, bps) → string. */
export const b = (v: bigint): string => v.toString();
/** numeric column (string) → wad. */
export const w = (v: string | null | undefined): Wad => (v === null || v === undefined ? 0n : parseDecimal(v));

/** Recursively convert bigints to strings so objects can be JSON-encoded. */
export function jsonSafe<T>(value: T): unknown {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(jsonSafe);
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = jsonSafe(v);
    return out;
  }
  return value;
}
