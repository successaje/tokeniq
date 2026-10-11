import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    // Live tests (LIVE_CHAIN_TESTS=1) hit public RPCs and the Morpho API.
    testTimeout: 60_000,
  },
});
