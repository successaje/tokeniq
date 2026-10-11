import type { OpportunityDto } from "@/lib/types";

export const MEASUREMENT_LABEL: Record<OpportunityDto["apy"]["measurement"], string> = {
  instantaneous: "Instantaneous rate",
  "1d_average": "1-day average",
  "7d_average": "7-day average",
  "30d_average": "30-day average",
};

export const WITHDRAWAL_LABEL: Record<OpportunityDto["withdrawal"], string> = {
  instant_subject_to_liquidity: "Instant, subject to liquidity",
  queued: "Queued",
  locked: "Locked",
};

export const PROTOCOL_LABEL: Record<string, string> = { morpho: "Morpho", "aave-v3": "Aave v3" };

export const protocolLabel = (p: string) => PROTOCOL_LABEL[p] ?? p;

export const KIND_LABEL: Record<OpportunityDto["kind"], string> = { erc4626_vault: "ERC-4626 vault", lending_market: "Lending market" };

/** Seconds since epoch → ISO string. */
export const fetchedIso = (o: OpportunityDto) => new Date(o.source.fetchedAt * 1000).toISOString();

/** Venue data is refreshed every 15 minutes; two missed refreshes is stale. */
export const VENUE_STALE_MINUTES = 30;
