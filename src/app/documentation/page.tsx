'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DocumentationPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the GitBook documentation
    window.location.href = 'https://tokeniq.gitbook.io/';
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-lg font-medium">Redirecting to TokenIQ Documentation...</p>
      </div>
    </div>
  );
}
