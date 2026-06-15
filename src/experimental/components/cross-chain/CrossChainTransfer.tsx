import { useState, useEffect } from 'react';
import { useCrossChainRouter } from '@/hooks/useCrossChainRouter';
import { sepolia, avalancheFuji, baseSepolia } from 'wagmi/chains';

// Define ChainId as a union type of supported chain IDs
type ChainId = typeof sepolia.id | typeof avalancheFuji.id | typeof baseSepolia.id;

// Define supported chains
const SUPPORTED_CHAINS = {
  [sepolia.id]: {
    id: sepolia.id as ChainId,
    name: 'Ethereum Sepolia',
    explorerUrl: 'https://sepolia.etherscan.io',
  },
  [avalancheFuji.id]: {
    id: avalancheFuji.id as ChainId,
    name: 'Avalanche Fuji',
    explorerUrl: 'https://testnet.snowtrace.io',
  },
  [baseSepolia.id]: {
    id: baseSepolia.id as ChainId,
    name: 'Base Sepolia',
    explorerUrl: 'https://sepolia.basescan.org',
  },
};
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatEther, parseEther } from 'viem';
import { Loader2, ArrowRight, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';

export function CrossChainTransfer() {
  const { toast } = useToast();
  const {
    estimateTransferFee,
    transfer,
    getSupportedTokens,
    getPendingTransfers,
    isLoading,
    error,
    estimatedFee,
    estimatedTime,
    SUPPORTED_CHAINS,
  } = useCrossChainRouter();

  const [fromChain, setFromChain] = useState<ChainId>(ChainId.ETHEREUM_SEPOLIA);
  const [toChain, setToChain] = useState<ChainId>(ChainId.AVALANCHE_FUJI);
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState('');
  const [isEstimating, setIsEstimating] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [pendingTransfers, setPendingTransfers] = useState<any[]>([]);

  // Get supported tokens for the selected chain
  const supportedTokens = getSupportedTokens(fromChain);

  // Update token when chain changes if the current token is not supported
  useEffect(() => {
    if (supportedTokens.length > 0 && !supportedTokens.some(t => t.address === token)) {
      setToken(supportedTokens[0]?.address || '');
    }
  }, [fromChain, supportedTokens, token]);

  // Update destination chain when source chain changes
  useEffect(() => {
    const chainIds = Object.keys(SUPPORTED_CHAINS).map(Number) as ChainId[];
    const otherChains = chainIds.filter(id => id !== fromChain);
    if (otherChains.length > 0 && otherChains[0] !== toChain) {
      setToChain(otherChains[0]);
    }
  }, [fromChain, toChain]);

  // Load pending transfers
  useEffect(() => {
    const pending = getPendingTransfers();
    setPendingTransfers(pending);
  }, [getPendingTransfers]);

  const handleEstimateFee = async () => {
    if (!amount || !token) return;
    
    try {
      setIsEstimating(true);
      await estimateTransferFee(fromChain, toChain, token as `0x${string}`, amount);
    } catch (err) {
      console.error('Error estimating fee:', err);
      toast({
        title: 'Error',
        description: 'Failed to estimate transfer fee',
        variant: 'destructive',
      });
    } finally {
      setIsEstimating(false);
    }
  };

  const handleTransfer = async () => {
    if (!amount || !token) return;
    
    try {
      setIsTransferring(true);
      
      await transfer(
        fromChain,
        toChain,
        token as `0x${string}`,
        amount,
        (completedTransfer) => {
          toast({
            title: 'Transfer Completed',
            description: `Successfully transferred ${amount} tokens to ${SUPPORTED_CHAINS[toChain]?.name}`,
          });
          // Refresh pending transfers
          setPendingTransfers(getPendingTransfers());
        },
        (error) => {
          toast({
            title: 'Transfer Failed',
            description: error.message,
            variant: 'destructive',
          });
        }
      );
    } catch (err) {
      console.error('Transfer error:', err);
      toast({
        title: 'Error',
        description: 'Failed to initiate transfer',
        variant: 'destructive',
      });
    } finally {
      setIsTransferring(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds} seconds`;
    return `${Math.ceil(seconds / 60)} minutes`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cross-Chain Transfer</CardTitle>
          <CardDescription>
            Transfer tokens between different blockchains
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From Chain</Label>
              <Select
                value={fromChain.toString()}
                onValueChange={(value) => setFromChain(Number(value) as ChainId)}
                disabled={isLoading || isTransferring}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source chain" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SUPPORTED_CHAINS).map(([id, chain]) => (
                    <SelectItem key={id} value={id}>
                      {chain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>To Chain</Label>
              <Select
                value={toChain.toString()}
                onValueChange={(value) => setToChain(Number(value) as ChainId)}
                disabled={isLoading || isTransferring}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select destination chain" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SUPPORTED_CHAINS)
                    .filter(([id]) => Number(id) !== fromChain)
                    .map(([id, chain]) => (
                      <SelectItem key={id} value={id}>
                        {chain.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Token</Label>
            <Select
              value={token}
              onValueChange={setToken}
              disabled={isLoading || isTransferring || supportedTokens.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select token" />
              </SelectTrigger>
              <SelectContent>
                {supportedTokens.map((t) => (
                  <SelectItem key={t.address} value={t.address}>
                    {t.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLoading || isTransferring}
            />
          </div>

          <div className="flex flex-col space-y-2 pt-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Estimated Fee:</span>
              <span>{estimatedFee} ETH</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Estimated Time:</span>
              <span>{formatTime(estimatedTime)}</span>
            </div>
          </div>

          <div className="flex flex-col space-y-2 pt-2">
            <Button
              onClick={handleEstimateFee}
              disabled={!amount || !token || isEstimating || isTransferring}
              className="w-full"
            >
              {isEstimating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Estimating...
                </>
              ) : (
                'Estimate Fee'
              )}
            </Button>

            <Button
              onClick={handleTransfer}
              disabled={!amount || !token || isEstimating || isTransferring || !estimatedFee}
              className="w-full mt-2"
            >
              {isTransferring ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Transferring...
                </>
              ) : (
                <>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Transfer
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {pendingTransfers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Transfers</CardTitle>
            <CardDescription>Your in-progress cross-chain transfers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingTransfers.map((t) => (
                <div key={t.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(t.status)}
                      <span className="font-medium">
                        {t.amount} {supportedTokens.find(tok => tok.address === t.token)?.symbol || 'Tokens'}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {SUPPORTED_CHAINS[t.fromChain]?.name} → {SUPPORTED_CHAINS[t.toChain]?.name}
                    </div>
                  </div>
                  {t.txHash && (
                    <div className="mt-2 text-sm">
                      <a
                        href={`${SUPPORTED_CHAINS[t.fromChain]?.explorerUrl}/tx/${t.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        View on Explorer
                      </a>
                    </div>
                  )}
                  {t.status === 'pending' && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Processing...</span>
                        <span>~{formatTime(estimatedTime)}</span>
                      </div>
                      <Progress value={50} className="h-2" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error.message}</span>
        </div>
      )}
    </div>
  );
}

export default CrossChainTransfer;
