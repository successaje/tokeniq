-- Create a table for public profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  wallet_address text unique not null,
  chain_id integer,
  username text unique,
  email text,
  avatar_url text,
  onboarding_complete boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_login timestamp with time zone,
  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Create policies for public access
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- Create a function to update the updated_at column
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Create a trigger to update the updated_at column
create or replace trigger on_profiles_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- Create a function to handle new user signups via wallet
create or replace function public.handle_new_wallet_user()
returns trigger as $$
begin
  insert into public.profiles (id, wallet_address, chain_id, created_at, updated_at)
  values (
    new.id,
    new.raw_user_meta_data->>'wallet_address',
    (new.raw_user_meta_data->>'chain_id')::integer,
    new.created_at,
    new.updated_at
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create a trigger to handle new user creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_wallet_user();

-- Add table to realtime publication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;

-- Create indexes for better performance
create index if not exists profiles_wallet_address_idx on public.profiles (wallet_address);
create index if not exists profiles_username_idx on public.profiles (username);
