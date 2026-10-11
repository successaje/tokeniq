import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full border-collapse text-[13px]", className)} {...props} />
    </div>
  );
}

export function Th({ className, numeric, ...props }: ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return <th scope="col" className={cn("h-9 border-b border-hairline px-3 text-left text-xs font-medium text-text-2 first:pl-4 last:pr-4 sm:first:pl-5 sm:last:pr-5", numeric && "text-right", className)} {...props} />;
}

export function Td({ className, numeric, ...props }: TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return <td className={cn("h-11 border-b border-hairline px-3 align-middle text-text first:pl-4 last:pr-4 sm:first:pl-5 sm:last:pr-5", numeric && "num text-right", className)} {...props} />;
}

export function Tr({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("transition-colors duration-[var(--dur-fast)] hover:bg-sunken/60 [&:last-child>td]:border-b-0", className)} {...props} />;
}
