import { useEffect, useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

export const useUserProfile = (walletAddress: string | undefined) => {
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const checkUserExists = useCallback(async (address: string) => {
    if (!address) {
      setUserExists(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const normalizedAddress = address.toLowerCase();
    
    try {
      console.log('Checking user with address:', normalizedAddress);
      const supabase = getSupabaseClient();
      
      // Test the Supabase connection first
      const { data: authData, error: authError } = await supabase.auth.getSession();
      if (authError) {
        throw new Error(`Supabase auth error: ${authError.message}`);
      }
      console.log('Supabase session:', authData.session);

      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('wallet_address')
        .eq('wallet_address', normalizedAddress)
        .maybeSingle();

      if (queryError) {
        throw new Error(`Supabase query error: ${queryError.message}`);
      }

      if (!data) {
        console.log('No user found for address:', normalizedAddress);
        setUserExists(false);
      } else {
        console.log('User found:', data);
        setUserExists(true);
      }
    } catch (err) {
      console.error('Error in checkUserExists:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      setUserExists(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (walletAddress) {
      checkUserExists(walletAddress);
    } else {
      setUserExists(false);
      setIsLoading(false);
    }
  }, [walletAddress, checkUserExists]);

  return { 
    userExists, 
    isLoading, 
    error, 
    refresh: () => walletAddress ? checkUserExists(walletAddress) : Promise.resolve()
  };
};
