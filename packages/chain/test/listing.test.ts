import { getAddress } from "viem";
import { describe, expect, it } from "vitest";
import { CONSIDERED_NOT_LISTED, getListedVenue, isListed, LISTED_VENUES, LISTING_CRITERIA, LISTING_REVIEW, LISTING_RULES } from "../src/listing.js";

describe("vetted venue list", () => {
  it("records the review and its non-endorsement note", () => {
    expect(LISTING_REVIEW).toMatchObject({ date: "2026-10-11", reviewer: "TokenIQ engineering (internal)" });
    expect(LISTING_CRITERIA).toContain("not an endorsement or audit");
    expect(LISTING_CRITERIA).toContain("$50M");
  });

  it("only lists USDC venues on the allowed chains, with ids derived from their addresses", () => {
    for (const v of LISTED_VENUES) {
      expect(v.asset).toBe("USDC");
      expect(v.id).toBe(`${v.protocol}:${v.chainId}:${v.address.toLowerCase()}`);
      expect(getAddress(v.address)).toBe(v.address);
      const allowedChains: readonly number[] = v.protocol === "morpho" ? LISTING_RULES.morpho.chainIds : LISTING_RULES.aave.chainIds;
      expect(allowedChains).toContain(v.chainId);
      if (v.protocol === "morpho") expect(LISTING_RULES.morpho.curators as readonly string[]).toContain(v.curator);
    }
    expect(new Set(LISTED_VENUES.map((v) => v.id)).size).toBe(LISTED_VENUES.length);
  });

  it("isListed is case-insensitive and excludes considered-but-rejected venues", () => {
    expect(isListed("morpho:8453:0xeE8F4eC5672F09119b96Ab6fB59C27E1b7e44b61")).toBe(true);
    expect(getListedVenue("MORPHO:1:0xBEEF01735C132ADA46AA9AA4C54623CAA92A64CB")?.name).toBe("Steakhouse USDC");
    for (const v of CONSIDERED_NOT_LISTED) expect(isListed(v.id)).toBe(false);
    expect(isListed("morpho:137:0xee8f4ec5672f09119b96ab6fb59c27e1b7e44b61")).toBe(false);
  });
});
