'use client';

import { useUserProfile } from '@/hooks/useUserProfile';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';

export default function TestSupabasePage() {
  const { address } = useAccount();
  const { userExists, isLoading, error, refresh } = useUserProfile(address);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="font-semibold">Connection Status</h2>
          <div className="mt-2 p-4 bg-gray-100 rounded">
            {isLoading ? (
              <p>Loading...</p>
            ) : error ? (
              <div className="text-red-600">
                <p className="font-semibold">Error:</p>
                <pre className="whitespace-pre-wrap">{error.message}</pre>
                {error.stack && (
                  <details className="mt-2">
                    <summary className="text-sm cursor-pointer">View stack trace</summary>
                    <pre className="text-xs mt-1 p-2 bg-gray-800 text-gray-100 rounded overflow-auto">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            ) : (
              <div className="text-green-600">
                <p>Connected to Supabase successfully!</p>
                <p>User exists: {userExists ? 'Yes' : 'No'}</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="font-semibold">Test Actions</h2>
          <div className="mt-2 space-x-2">
            <Button 
              onClick={() => refresh()} 
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? 'Refreshing...' : 'Refresh Status'}
            </Button>
          </div>
        </div>

        <div>
          <h2 className="font-semibold">Debug Info</h2>
          <div className="mt-2 p-4 bg-gray-100 rounded text-sm">
            <p><strong>Wallet Address:</strong> {address || 'Not connected'}</p>
            <p><strong>Loading State:</strong> {isLoading ? 'Loading...' : 'Idle'}</p>
            <p><strong>User Exists:</strong> {userExists === null ? 'Unknown' : userExists ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
