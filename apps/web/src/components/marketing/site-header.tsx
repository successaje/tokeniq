"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/cn";
import { CTA, MAIN_NAV } from "@/lib/marketing-site";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close the menu when the route changes or Escape is pressed.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-canvas pt-safe">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="TokenIQ home" className="shrink-0 rounded-[var(--radius-chip)]">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden flex-1 lg:block">
          <ul className="flex items-center gap-1">
            {MAIN_NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn("rounded-[var(--radius-control)] px-3 py-2 text-[13px] font-medium transition-colors duration-[var(--dur-fast)]", active ? "text-text" : "text-text-2 hover:text-text")}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href={CTA.signIn.href} className="hidden h-9 items-center rounded-[var(--radius-control)] px-3 text-[13px] font-medium text-text-2 hover:bg-sunken hover:text-text sm:inline-flex">
            {CTA.signIn.label}
          </Link>
          <Link href={CTA.primary.href} className="inline-flex h-9 items-center rounded-[var(--radius-control)] bg-accent px-4 text-[13px] font-medium text-on-accent transition-colors duration-[var(--dur-fast)] hover:bg-accent-hover">
            {CTA.primary.label}
          </Link>
          <button
            ref={buttonRef}
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-[var(--radius-control)] text-text-2 hover:bg-sunken hover:text-text lg:hidden"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </div>
      <div id={panelId} hidden={!open} className="border-t border-hairline bg-canvas lg:hidden">
        <nav aria-label="Main" className="mx-auto max-w-[1240px] px-4 pb-5 pt-2 sm:px-6">
          <ul className="divide-y divide-hairline">
            {MAIN_NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} aria-current={isActive(pathname, item.href) ? "page" : undefined} className="flex min-h-12 items-center justify-between text-[15px] font-medium text-text aria-[current=page]:text-accent">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href={CTA.signIn.href} className="flex min-h-12 items-center text-[15px] font-medium text-text-2">
                {CTA.signIn.label}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
