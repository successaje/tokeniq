import { useEffect, useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

export const useUserProfile = (walletAddress: string | undefined) => {
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkUserExists = useCallback(async (address: string) => {
    if (!address) {
      setUserExists(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const normalizedAddress = address.toLowerCase();
    const supabase = getSupabaseClient();

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('wallet_address')
        .eq('wallet_address', normalizedAddress)
        .maybeSingle();

      if (error) {
        console.error('Error checking user:', error);
        setUserExists(false);
      } else {
        setUserExists(!!data);
      }
    } catch (error) {
      console.error('Error checking user:', error);
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
    refresh: () => walletAddress ? checkUserExists(walletAddress) : Promise.resolve()
  };
};
