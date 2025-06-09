export interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  chainId: number
  logoURI?: string
}

export const tokens: Token[] = [
  {
    address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    chainId: 1,
    logoURI: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
  },
  {
    address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    symbol: "MATIC",
    name: "Polygon",
    decimals: 18,
    chainId: 137,
    logoURI: "https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png",
  },
  {
    address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    chainId: 42161,
    logoURI: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
  },
  {
    address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    chainId: 10,
    logoURI: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
  },
  {
    address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    chainId: 1,
    logoURI: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png",
  },
  {
    address: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    chainId: 137,
    logoURI: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png",
  },
  {
    address: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    chainId: 42161,
    logoURI: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png",
  },
  {
    address: "0x7f5c764cbc14f9669b88837ca1490cca17c31607",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    chainId: 10,
    logoURI: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png",
  },
] 