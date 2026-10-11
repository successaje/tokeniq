/**
 * Engine evidence and alert refs ("reserve", "opportunity:<id>", "position:<id>"…)
 * mapped to a readable source name and the page where that record lives.
 */
export function refTarget(ref: string | null | undefined): { label: string; href: string | null } {
  if (!ref) return { label: "—", href: null };
  const [kind, ...rest] = ref.split(":");
  const id = rest.join(":");
  switch (kind) {
    case "reserve":
      return { label: "Reserve assessment", href: "/app/reserves" };
    case "treasury":
      return { label: "Treasury balances", href: "/app/treasury" };
    case "policy":
      return { label: "Treasury policy", href: "/app/reserves" };
    case "positions":
      return { label: "Protocol positions", href: "/app/allocations" };
    case "position":
      return { label: "Position", href: "/app/allocations" };
    case "opportunity":
      return { label: "Venue data", href: `/app/opportunities?venue=${encodeURIComponent(id)}` };
    case "obligations":
      return { label: "Obligations", href: "/app/obligations" };
    case "obligation":
      return { label: "Obligation", href: id ? `/app/obligations/${encodeURIComponent(id)}` : "/app/obligations" };
    case "account":
      return { label: "Account", href: "/app/accounts" };
    case "asset":
      return { label: "Asset prices", href: "/app/treasury" };
    case "protocol":
      return { label: "Protocol exposure", href: "/app/allocations" };
    case "chain":
      return { label: "Network status", href: "/status" };
    case "provider":
      return { label: "Data provider status", href: "/status" };
    default:
      return { label: kind ?? ref, href: null };
  }
}
