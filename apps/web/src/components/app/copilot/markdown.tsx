import Link from "next/link";
import { Fragment, type ReactNode } from "react";

/**
 * A deliberately small Markdown renderer for copilot answers. It never injects
 * HTML (React escapes all text), supports paragraphs, headings, lists, simple
 * tables, **bold**, `code`, and turns [ref:kind:id] citations into links to the
 * cited records. Links to arbitrary URLs are not rendered as links.
 */

const REF_ROUTES: Record<string, (id: string) => string> = {
  treasury: () => "/app/treasury",
  reserve: () => "/app/reserves",
  policy: () => "/app/reserves",
  scenario: () => "/app/reserves#scenarios",
  obligation: (id) => `/app/obligations/${id}`,
  account: () => "/app/accounts",
  position: () => "/app/allocations",
  recommendation: (id) => `/app/recommendations#${id}`,
  opportunity: () => "/app/opportunities",
  alert: () => "/app/risk",
  proposal: (id) => `/app/approvals/${id}`,
  activity: () => "/app/activity",
};

const REF_LABEL: Record<string, string> = {
  treasury: "Treasury",
  reserve: "Reserve",
  policy: "Policy",
  scenario: "Scenario",
  obligation: "Obligation",
  account: "Account",
  position: "Position",
  recommendation: "Recommendation",
  opportunity: "Venue",
  alert: "Alert",
  proposal: "Proposal",
  activity: "Activity",
};

function RefChip({ refId }: { refId: string }) {
  const [kind, ...rest] = refId.split(":");
  const id = rest.join(":");
  const route = REF_ROUTES[kind ?? ""];
  const label = REF_LABEL[kind ?? ""] ?? "Source";
  if (!route) return <span className="text-text-3">[{label}]</span>;
  return (
    <Link href={route(id)} className="mx-0.5 inline-flex items-center rounded-[var(--radius-chip)] bg-accent-subtle px-1.5 align-baseline text-[11px] font-medium text-accent no-underline hover:underline" title={`Source: ${refId}`}>
      {label}
    </Link>
  );
}

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\[ref:[^\]\s]+\]|\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(<Fragment key={`${keyBase}-t${i++}`}>{text.slice(last, m.index)}</Fragment>);
    const tok = m[0];
    if (tok.startsWith("[ref:")) out.push(<RefChip key={`${keyBase}-r${i++}`} refId={tok.slice(5, -1)} />);
    else if (tok.startsWith("**")) out.push(<strong key={`${keyBase}-b${i++}`} className="font-semibold text-text">{tok.slice(2, -2)}</strong>);
    else out.push(<code key={`${keyBase}-c${i++}`} className="rounded bg-sunken px-1 font-mono text-[12px]">{tok.slice(1, -1)}</code>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(<Fragment key={`${keyBase}-t${i++}`}>{text.slice(last)}</Fragment>);
  return out;
}

export function CopilotMarkdown({ text }: { text: string }) {
  const lines = text.replace(/\r/g, "").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let k = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    if (!line.trim()) {
      i++;
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      blocks.push(<h4 key={k++} className="mt-3 text-[13.5px] font-semibold text-text first:mt-0">{inline(h[2]!, `h${k}`)}</h4>);
      i++;
      continue;
    }
    if (/^\s*\|.*\|\s*$/.test(line)) {
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i]!)) {
        const cells = lines[i]!.trim().slice(1, -1).split("|").map((c) => c.trim());
        if (!cells.every((c) => /^:?-{2,}:?$/.test(c))) rows.push(cells);
        i++;
      }
      const [head, ...body] = rows;
      blocks.push(
        <div key={k++} className="my-2 overflow-x-auto">
          <table className="w-full text-[12.5px]">
            {head && (
              <thead>
                <tr>{head.map((c, j) => <th key={j} className="border-b border-hairline px-2 py-1 text-left font-medium text-text-2">{inline(c, `th${k}${j}`)}</th>)}</tr>
              </thead>
            )}
            <tbody>
              {body.map((r, ri) => (
                <tr key={ri}>{r.map((c, j) => <td key={j} className="num border-b border-hairline px-2 py-1">{inline(c, `td${k}${ri}${j}`)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items: string[] = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i]!)) {
        items.push(lines[i]!.replace(/^\s*([-*]|\d+\.)\s+/, ""));
        i++;
      }
      const L = ordered ? "ol" : "ul";
      blocks.push(
        <L key={k++} className={ordered ? "my-1.5 list-decimal space-y-1 pl-5" : "my-1.5 list-disc space-y-1 pl-5"}>
          {items.map((it, j) => (
            <li key={j}>{inline(it, `li${k}${j}`)}</li>
          ))}
        </L>,
      );
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i]!.trim() && !/^(#{1,4}\s|\s*\||\s*([-*]|\d+\.)\s)/.test(lines[i]!)) {
      para.push(lines[i]!);
      i++;
    }
    blocks.push(<p key={k++} className="my-1.5 first:mt-0">{inline(para.join(" "), `p${k}`)}</p>);
  }
  return <div className="text-[13.5px] leading-6 text-text-2">{blocks}</div>;
}
