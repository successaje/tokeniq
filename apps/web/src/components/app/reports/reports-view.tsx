"use client";

import { ArrowRight, FileDown, FileSpreadsheet, Printer } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Callout } from "@/components/ui/status";
import { orgPath } from "@/lib/api";
import { useOrg } from "@/lib/org";

interface ExportSpec {
  kind: "activity" | "obligations" | "payments" | "balances" | "proposals" | "policies";
  title: string;
  description: string;
  columns: string[];
  semantics: string;
}

/** Mirrors apps/api/src/modules/reports.ts so people know exactly what each file contains. */
const EXPORTS: ExportSpec[] = [
  {
    kind: "obligations",
    title: "Obligations",
    description: "Every obligation you have recorded, including paused, cancelled and completed ones, ordered by first due date.",
    columns: ["id", "title", "category", "direction", "amount", "currency", "first_due_date", "recurrence", "certainty", "priority", "status", "counterparty", "recipient_address", "invoice_number"],
    semantics: "Amounts are in the obligation's own currency (USD or EUR), exactly as entered. Recurrence is the stored rule as JSON; individual occurrences are not expanded.",
  },
  {
    kind: "payments",
    title: "Payments",
    description: "Settled obligation occurrences: paid with on-chain verification, paid without verification, or skipped.",
    columns: ["obligation", "due_date", "status", "amount_usd", "asset", "token_amount_raw", "network", "tx_hash", "explorer_url", "verified_at"],
    semantics: "token_amount_raw is an integer in the token's smallest unit (divide by 10^decimals, e.g. 6 for USDC). verified_at is empty when the transfer was not verified on-chain.",
  },
  {
    kind: "balances",
    title: "Balance history",
    description: "Raw balance observations per account and asset, newest first (up to 50,000 rows).",
    columns: ["observed_at_utc", "account", "address", "network", "asset", "asset_address", "raw_balance", "block_number", "block_hash"],
    semantics: "Balances are raw integers read at the stated block, with no prices applied, so they can be reconciled against any block explorer.",
  },
  {
    kind: "proposals",
    title: "Proposals",
    description: "Proposals with their internal approvals and on-chain executions.",
    columns: ["id", "created_at_utc", "kind", "title", "status", "amount_usd", "network", "safe_tx_hash", "approvals", "executions"],
    semantics: "approvals lists email:decision@time entries separated by semicolons; executions lists tx_hash:status. Internal approval is not a Safe signature, and a submitted transaction is not a confirmed one.",
  },
  {
    kind: "policies",
    title: "Policy history",
    description: "Every version of the treasury and approval policies, who saved it and why.",
    columns: ["kind", "version", "created_at_utc", "author", "reason", "body_json"],
    semantics: "body_json is the complete policy as saved. Versions are append-only; a change always creates a new version.",
  },
  {
    kind: "activity",
    title: "Activity log",
    description: "The complete audit trail, oldest first.",
    columns: ["id", "timestamp_utc", "actor_type", "actor", "action", "target_type", "target_id", "data_json"],
    semantics: "actor is the member's email (empty for automatic events). data_json holds the event details, such as policy changes or a dismissal reason.",
  },
];

export function ReportsView() {
  const { orgId } = useOrg();
  return (
    <div>
      <PageHeader title="Reports" description="A printable treasury snapshot and CSV exports of your records. Each export is recorded in the activity log." />

      <Card className="mb-6">
        <div className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:px-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-accent-subtle text-accent" aria-hidden="true">
            <Printer className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold text-text">Treasury snapshot</h2>
            <p className="mt-0.5 text-[13px] text-text-2">
              One printable page: the position in a sentence, totals, the reserve requirement and its rules, what is deployable, obligations in the horizon and holdings. Print it or save it as PDF from your browser. It is a management report, not an audited financial statement.
            </p>
          </div>
          <Button asChild className="max-sm:h-11">
            <Link href="/app/reports/snapshot">
              Open snapshot <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </Card>

      <h2 className="mb-3 text-[15px] font-semibold text-text">CSV exports</h2>
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {EXPORTS.map((x) => (
          <li key={x.kind} className="flex">
            <Card className="flex w-full flex-col">
              <CardBody className="flex-1">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="size-4 text-text-3" aria-hidden="true" />
                  <h3 className="text-sm font-semibold text-text">{x.title}</h3>
                </div>
                <p className="mt-1 text-[13px] text-text-2">{x.description}</p>
                <div className="mt-3">
                  <div className="text-xs font-medium text-text-2">Columns</div>
                  <ul className="mt-1 flex flex-wrap gap-1" aria-label={`${x.title} columns`}>
                    {x.columns.map((c) => (
                      <li key={c} className="rounded-[var(--radius-chip)] bg-sunken px-1.5 py-0.5 font-mono text-[11px] text-text-2">
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="mt-3 text-xs text-text-3">{x.semantics}</p>
              </CardBody>
              <CardFooter>
                <Button variant="secondary" size="sm" asChild>
                  <a href={orgPath(orgId, `/reports/export/${x.kind}.csv`)} download>
                    <FileDown className="size-4" aria-hidden="true" /> Download {x.title.toLowerCase()} CSV
                  </a>
                </Button>
              </CardFooter>
            </Card>
          </li>
        ))}
      </ul>

      <Callout tone="neutral" className="mt-6" title="About these files">
        UTF-8, comma-separated, one header row (RFC 4180). Amounts are exact as stored, never rounded through floating point, and timestamps are UTC. Cells that a spreadsheet could interpret as a formula are prefixed with an apostrophe.
      </Callout>
    </div>
  );
}
