"use client";

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navbar } from "./navbar";

// List of routes where we don't want to show the main Navbar
const NO_NAVBAR_ROUTES = ['/dashboard', '/vaults', '/deposit', '/withdraw', '/swap', '/stake', '/governance'];

export function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const showNavbar = !NO_NAVBAR_ROUTES.some(route => pathname?.startsWith(route));
  
  if (!mounted) {
    return <>{children}</>;
  }
  
  return (
    <>
      {showNavbar && <Navbar />}
      <main className="flex-1">
        {children}
      </main>
    </>
  );
}
