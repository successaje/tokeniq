'use client'

import { useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { web3Modal } from '@/config/wagmi'

export function Web3Modal({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration errors
  if (!mounted) return null

  return (
    <>
      {children}
    </>
  )
}

// This is a separate component to handle the connect button
export function ConnectButton() {
  const { isConnected, address } = useAccount()
  const { open } = web3Modal

  if (isConnected) {
    return (
      <button 
        onClick={() => web3Modal.open()}
        className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg text-white font-medium transition-colors"
      >
        {`${address?.slice(0, 6)}...${address?.slice(-4)}`}
      </button>
    )
  }

  return (
    <button 
      onClick={() => web3Modal.open()}
      className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg text-white font-medium transition-colors"
    >
      Connect Wallet
    </button>
  )
}
