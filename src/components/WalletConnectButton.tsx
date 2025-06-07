'use client'

import { useAccount, useDisconnect } from 'wagmi'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { Button } from './ui/Button'

export function WalletConnectButton() {
  const { isConnected, address } = useAccount()
  const { disconnect } = useDisconnect()
  const { open } = useWeb3Modal()

  if (isConnected && address) {
    const shortenedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`
    
    return (
      <div className="flex items-center space-x-2">
        <div className="px-3 py-1 text-sm font-medium text-white bg-gray-800 rounded-lg">
          {shortenedAddress}
        </div>
        <Button 
          onClick={() => disconnect()}
          variant="outline"
          size="sm"
        >
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <Button 
      onClick={() => open()}
      className="bg-primary-600 hover:bg-primary-700"
    >
      Connect Wallet
    </Button>
  )
}
