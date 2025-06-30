import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useAaveVault } from '@/hooks/useAaveVault';
import { formatEther } from 'viem';

export function AaveVaultInfo() {
  const [isLoading, setIsLoading] = useState(true);
  const [vaultInfo, setVaultInfo] = useState<any>(null);
  const [vaultStats, setVaultStats] = useState<any>(null);
  const [userPosition, setUserPosition] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    getTokenInfo,
    getVaultStats,
    getUserPosition,
    checkIfPaused,
    getContractOwner,
  } = useAaveVault();

  const fetchData = async () => {
    try {
      setIsRefreshing(true);
      const [info, stats, position] = await Promise.all([
        getTokenInfo(),
        getVaultStats(),
        getUserPosition(),
      ]);

      if (info.success) setVaultInfo(info.data);
      if (stats.success) setVaultStats(stats.data);
      if (position.success) setUserPosition(position.data);
    } catch (error) {
      console.error('Error fetching vault data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatAddress = (address: string) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Vault Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Vault Information</CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={fetchData}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Contract Info</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={vaultStats?.isPaused ? 'text-destructive' : 'text-green-500'}>
                  {vaultStats?.isPaused ? 'Paused' : 'Active'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Owner:</span>
                <span className="font-mono">{vaultInfo?.owner ? formatAddress(vaultInfo.owner) : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Underlying Token:</span>
                <span className="font-mono">{vaultInfo?.underlyingToken ? formatAddress(vaultInfo.underlyingToken) : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>aToken:</span>
                <span className="font-mono">{vaultInfo?.aToken ? formatAddress(vaultInfo.aToken) : 'N/A'}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Vault Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Deposits:</span>
                <span>{vaultStats?.totalDeposits ? formatEther(vaultStats.totalDeposits) : '0'} ETH</span>
              </div>
              <div className="flex justify-between">
                <span>Total Withdrawals:</span>
                <span>{vaultStats?.totalWithdrawals ? formatEther(vaultStats.totalWithdrawals) : '0'} ETH</span>
              </div>
              <div className="flex justify-between">
                <span>Current Allocation:</span>
                <span>{vaultStats?.currentAllocation ? `${formatEther(vaultStats.currentAllocation)}%` : 'N/A'}</span>
              </div>
            </div>
          </div>

          {userPosition && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Your Position</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>aToken Balance:</span>
                  <span>{userPosition?.formatted?.aTokenBalance || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Underlying Balance:</span>
                  <span>{userPosition?.formatted?.underlyingBalance || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Health Factor:</span>
                  <span>{userPosition?.healthFactor ? userPosition.healthFactor.toFixed(2) : 'N/A'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
