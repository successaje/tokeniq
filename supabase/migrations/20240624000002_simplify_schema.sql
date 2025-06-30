-- Drop existing tables and functions that will be recreated
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_updated_at();
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_wallet_user();

-- Drop existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

-- Create a new simplified profiles table
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
  wallet_address text PRIMARY KEY,
  chain_id integer,
  username text UNIQUE,
  email text,
  avatar_url text,
  onboarding_complete boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_login timestamp with time zone,
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow public to view profiles
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles 
  FOR SELECT 
  USING (true);

-- Allow anyone to insert a new profile
CREATE POLICY "Allow public profile creation" 
  ON public.profiles
  FOR INSERT 
  WITH CHECK (true);

-- Allow users to update their own profile using wallet address
CREATE POLICY "Users can update own profile" 
  ON public.profiles
  FOR UPDATE 
  USING (
    wallet_address = current_setting('request.headers', true)::json->>'x-wallet-address'
  );

-- Allow users to delete their own profile using wallet address
CREATE POLICY "Users can delete own profile"
  ON public.profiles
  FOR DELETE
  USING (
    wallet_address = current_setting('request.headers', true)::json->>'x-wallet-address'
  );

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to update the updated_at column
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_wallet_address_idx ON public.profiles (wallet_address);
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (username);
