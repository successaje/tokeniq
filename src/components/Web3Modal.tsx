'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ConnectButton } from '@rainbow-me/rainbowkit'

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface CustomConnectButtonProps {
  className?: string;
  showFullAddress?: boolean;
}

export function CustomConnectButton({ 
  className = '',
  showFullAddress = false 
}: CustomConnectButtonProps) {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button 
                    onClick={openConnectModal} 
                    className={cn(
                      "rounded-full font-semibold shadow-[0_0_20px_-5px_rgba(var(--primary),0.4)] hover:shadow-[0_0_30px_-5px_rgba(var(--primary),0.6)] transition-all bg-primary/90 hover:bg-primary",
                      className
                    )}
                  >
                    Connect Wallet
                  </Button>
                );
              }

              if (chain.unsupported) {
                return (
                  <Button onClick={openChainModal} variant="destructive" className="rounded-full">
                    Wrong network
                  </Button>
                );
              }

              return (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={openChainModal}
                    variant="outline"
                    className="flex items-center gap-2 rounded-full border-border/50 bg-background/50 backdrop-blur-sm px-3"
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 16,
                          height: 16,
                          borderRadius: 999,
                          overflow: 'hidden',
                          marginRight: 4,
                        }}
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            style={{ width: 16, height: 16 }}
                          />
                        )}
                      </div>
                    )}
                    <span className="text-xs hidden sm:block">{chain.name}</span>
                  </Button>

                  <Button 
                    onClick={openAccountModal} 
                    variant="outline"
                    className="flex items-center gap-2 rounded-full border-primary/30 bg-primary/10 hover:bg-primary/20 backdrop-blur-sm text-primary font-mono px-4"
                  >
                    {account.displayBalance
                      ? ` ${account.displayBalance}`
                      : ''}
                    <span className="text-foreground ml-2">
                      {showFullAddress ? account.address : account.displayName}
                    </span>
                  </Button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

// This component is no longer needed as we're using the Web3ModalProvider from @web3modal/ethers
// The Web3ModalProvider is already set up in the ClientProviders component
export function Web3Modal({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export { ConnectButton };
