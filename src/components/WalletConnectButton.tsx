'use client'

import { useAccount, useDisconnect } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { Button } from './ui/button';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export function WalletConnectButton() {
  const [isClient, setIsClient] = useState(false);
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useWeb3Modal();
  const { userExists, isLoading: isProfileLoading } = useUserProfile(address);
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Set isClient to true on mount (client-side only)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle user state changes without automatic redirection
  useEffect(() => {
    if (isClient && isConnected && address) {
      console.log('Wallet connected:', { address, userExists });
      // You can add any side effects here without automatic navigation
    }
  }, [isClient, isConnected, address, userExists]);

  // Don't render anything during SSR or while redirecting
  if (!isClient || isRedirecting) {
    return (
      <Button disabled variant="outline" size="sm">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        Loading...
      </Button>
    );
  }

  if (isConnected && address) {
    const shortenedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    
    return (
      <div className="flex items-center space-x-2">
        <div className="px-3 py-1 text-sm font-medium text-foreground bg-muted rounded-lg">
          {shortenedAddress}
        </div>
        <Button 
          onClick={() => {
            setIsRedirecting(true);
            disconnect();
          }}
          variant="outline"
          size="sm"
          disabled={isProfileLoading || isRedirecting}
        >
          {isProfileLoading || isRedirecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Disconnect'
          )}
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={() => open()}
      className="bg-primary hover:bg-primary/90"
      disabled={isProfileLoading}
    >
      {isProfileLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        'Connect Wallet'
      )}
    </Button>
  );
}
