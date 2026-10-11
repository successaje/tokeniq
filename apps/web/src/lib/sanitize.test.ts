import { describe, expect, it } from "vitest";
import { isAppPath, normalizeAmountInput, safeNext } from "./sanitize";

const ORIGIN = "http://localhost:3000";

describe("safeNext", () => {
  it("keeps same-origin paths with their query and hash", () => {
    expect(safeNext("/app/approvals/x?y=1#z", ORIGIN)).toBe("/app/approvals/x?y=1#z");
    expect(safeNext("/invite/abc", ORIGIN)).toBe("/invite/abc");
  });
  it("rejects anything that resolves to another origin", () => {
    for (const bad of ["//evil.example", "/\\evil.example", "/\t/evil.example", "/\n/evil.example", "/\r/evil.example", "https://evil.example", "javascript:alert(1)", "", null]) expect(safeNext(bad, ORIGIN)).toBe("/app");
  });
  it("leaves encoded slashes as an in-app path", () => {
    expect(safeNext("/%2F%2Fevil.example", ORIGIN)).toBe("/%2F%2Fevil.example");
  });
});

describe("isAppPath", () => {
  it("allows only in-app paths", () => {
    expect(isAppPath("/app/approvals/1")).toBe(true);
    expect(isAppPath("/app")).toBe(true);
    for (const bad of ["javascript:alert(1)", "//evil.example", "https://evil.example/app", "/apple", "/app\\..\\x", "/app/\t/x"]) expect(isAppPath(bad)).toBe(false);
  });
});

describe("normalizeAmountInput", () => {
  it("accepts plain decimals and thousands separators", () => {
    expect(normalizeAmountInput("1234.56", 2)).toBe("1234.56");
    expect(normalizeAmountInput(" 1,234,567.5 ", 2)).toBe("1234567.5");
    expect(normalizeAmountInput("", 2)).toBe("");
    expect(normalizeAmountInput("0.", 2)).toBe("0.");
  });
  it("rejects input whose meaning would change", () => {
    expect(normalizeAmountInput("1,5", 2)).toBeNull();
    expect(normalizeAmountInput("1.234,56", 2)).toBeNull();
    expect(normalizeAmountInput("12,34", 2)).toBeNull();
    expect(normalizeAmountInput("1.234", 2)).toBeNull();
    expect(normalizeAmountInput("-5", 2)).toBeNull();
    expect(normalizeAmountInput("1e6", 2)).toBeNull();
  });
});
