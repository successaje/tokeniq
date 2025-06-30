'use client'

import { useAccount } from 'wagmi'

export default function DashboardPage() {
  const { address } = useAccount()

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="bg-card p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">
          {address ? `Welcome!` : 'Connect your wallet to get started'}
        </h2>
        {address && (
          <p className="font-mono text-sm text-muted-foreground break-all">
            {address}
          </p>
        )}
      </div>
    </div>
  )
}
