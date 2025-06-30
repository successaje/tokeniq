import { createClient as createClientComponent } from '@supabase/supabase-js';
import { Database } from './database.types';

let globalWalletAddress = '';

// Update the global wallet address and get a new client instance
export const setWalletAddress = (address: string) => {
  globalWalletAddress = address?.toLowerCase() || '';
  // Create a new client instance with the updated wallet address
  supabase = createClient(globalWalletAddress);
  return supabase;
};

// Function to create a new client with the current wallet address
const createClient = (walletAddress: string = '') => {
  return createClientComponent<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          'x-wallet-address': walletAddress,
        },
      },
    }
  );
};

// Create the initial client
export let supabase = createClient(globalWalletAddress);

// Function to get the current client instance
export const getSupabaseClient = () => {
  return supabase;
};
