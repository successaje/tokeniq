export interface FeeEstimate {
  totalFee: bigint;
  gasFee: bigint;
  protocolFee: bigint;
  bridgeFee: bigint;
  token: string;
  tokenDecimals: number;
  formattedTotalFee: string;
  formattedGasFee: string;
  formattedProtocolFee: string;
  formattedBridgeFee: string;
  estimatedGas: bigint;
  gasPrice: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  estimatedTimeMs?: number;
  estimatedBlocks?: number;
}
