import type { AssetRef } from "@tokeniq/core";
import type { TokenInfo } from "./tokens.js";

/** The core engine's `AssetRef` for an allowlisted token. */
export function assetRefOf(token: TokenInfo): AssetRef {
  return {
    symbol: token.symbol,
    name: token.name,
    chainId: token.chainId,
    address: token.address,
    decimals: token.decimals,
    assetClass: token.assetClass,
    ...(token.pegCurrency ? { pegCurrency: token.pegCurrency } : {}),
  };
}
