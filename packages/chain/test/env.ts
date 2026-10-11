// Minimal typing for the one environment variable the tests read (no @types/node in this package).
declare const process: { env: Record<string, string | undefined> };

/** Live tests read real chain state and APIs; they only run with LIVE_CHAIN_TESTS=1. */
export const LIVE = process.env.LIVE_CHAIN_TESTS === "1";
