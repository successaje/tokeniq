"use client";

import { Search } from "lucide-react";
import { Dialog as D } from "radix-ui";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { ALL_NAV } from "./nav";

const ACTIONS = [
  { href: "/app/obligations?new=1", label: "Record an obligation", description: "Payroll, invoice, vendor or other commitment" },
  { href: "/app/accounts?add=1", label: "Add a treasury account", description: "Safe multisig or wallet" },
  { href: "/app/reserves#scenarios", label: "Run a stress scenario", description: "Depeg, new expense or frozen venue" },
  { href: "/app/copilot", label: "Ask the copilot", description: "Questions about your treasury, with sources" },
  { href: "/app/reports", label: "Export a report", description: "CSV exports and printable snapshot" },
];

/** ⌘K: jump to any section or start a common task. Fully keyboard operable. */
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [index, setIndex] = useState(0);
  const items = useMemo(() => {
    const all = [...ALL_NAV.map((n) => ({ href: n.href, label: n.label, description: n.description, kind: "Go to" })), ...ACTIONS.map((a) => ({ ...a, kind: "Action" }))];
    const needle = q.trim().toLowerCase();
    return needle ? all.filter((i) => `${i.label} ${i.description}`.toLowerCase().includes(needle)) : all;
  }, [q]);
  const go = (href: string) => {
    onOpenChange(false);
    setQ("");
    router.push(href);
  };
  return (
    <D.Root
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setQ("");
        setIndex(0);
      }}
    >
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-[var(--overlay)]" />
        <D.Content className="fixed left-1/2 top-[12vh] z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-[var(--radius-sheet)] border border-hairline bg-raised shadow-[var(--shadow-float)]">
          <D.Title className="sr-only">Search TokenIQ</D.Title>
          <D.Description className="sr-only">Type to filter sections and actions, use arrow keys to move and Enter to open.</D.Description>
          <div className="flex items-center gap-2 border-b border-hairline px-3">
            <Search className="size-4 text-text-3" aria-hidden="true" />
            <input
              autoFocus
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setIndex(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setIndex((i) => Math.min(items.length - 1, i + 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setIndex((i) => Math.max(0, i - 1));
                } else if (e.key === "Enter" && items[index]) {
                  e.preventDefault();
                  go(items[index]!.href);
                }
              }}
              placeholder="Search sections and actions…"
              className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-text-3"
              role="combobox"
              aria-expanded="true"
              aria-controls="command-list"
              aria-activedescendant={items[index] ? `cmd-${index}` : undefined}
            />
          </div>
          <ul id="command-list" role="listbox" className="max-h-80 overflow-y-auto p-1.5">
            {items.length === 0 && <li className="px-3 py-6 text-center text-sm text-text-2">No matches. Try “obligations” or “approvals”.</li>}
            {items.map((item, i) => (
              <li
                key={`${item.kind}-${item.href}`}
                id={`cmd-${i}`}
                role="option"
                aria-selected={i === index}
                onMouseEnter={() => setIndex(i)}
                onClick={() => go(item.href)}
                className={cn("flex cursor-pointer items-center gap-3 rounded-[var(--radius-control)] px-3 py-2", i === index && "bg-sunken")}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-text">{item.label}</span>
                  <span className="block truncate text-xs text-text-3">{item.description}</span>
                </span>
                <span className="text-[11px] text-text-3">{item.kind}</span>
              </li>
            ))}
          </ul>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
