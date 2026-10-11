import { DEFAULT_APPROVAL_POLICY, DEFAULT_TREASURY_POLICY, POLICY_PRESETS, formatBps } from "@tokeniq/core";
import Link from "next/link";
import type { ReactNode } from "react";
import { isPositive, usd } from "@/lib/format";
import { DEFAULT_INPUTS, runModel, type ModelInputs } from "@/lib/marketing-model";

export interface DocPage {
  slug: string;
  group: "Start" | "Concepts" | "Reference" | "Help";
  title: string;
  description: string;
  body: () => ReactNode;
}

const whole = (v: string) => usd(v, { decimals: 0 });

export function WorkedExample({ inputs, caption }: { inputs: ModelInputs; caption: string }) {
  const m = runModel(inputs);
  const get = (k: string) => m.buckets.find((b) => b.key === k)?.value ?? "0";
  return (
    <>
      <p>
        <strong>{caption}</strong>
      </p>
      <table>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Step</th>
            <th scope="col">Working</th>
            <th scope="col" className="text-right">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Reserve-eligible capital</td>
            <td>{inputs.events.depeg ? "1,250,000 USDC × $0.97" : "1,250,000 USDC × $1.00 (oracle price, capped at $1)"}</td>
            <td className="num text-right">{whole(m.available)}</td>
          </tr>
          {m.rules.map((r) => (
            <tr key={r.id}>
              <td>
                {r.label} rule{r.binding ? " (binding)" : ""}
              </td>
              <td>{r.basis}</td>
              <td className="num text-right">{whole(r.amount)}</td>
            </tr>
          ))}
          <tr>
            <td>Requirement</td>
            <td>The largest enabled rule</td>
            <td className="num text-right">{whole(m.required)}</td>
          </tr>
          <tr>
            <td>Available after the reserve</td>
            <td>
              {whole(m.available)} − {whole(m.required)}
            </td>
            <td className="num text-right">{whole(m.afterReserve)}</td>
          </tr>
          <tr>
            <td>Room under the deployment cap</td>
            <td>80% × {whole(m.gross)} gross − $0 already deployed</td>
            <td className="num text-right">{whole(m.capRemaining)}</td>
          </tr>
          <tr>
            <td>
              <strong>Deployable surplus</strong>
            </td>
            <td>The smaller of the two lines above</td>
            <td className="num text-right">
              <strong>{whole(m.deployable)}</strong>
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        Shown on the allocation bar as: upcoming obligations {whole(get("obligations"))}
        {isPositive(get("reserve")) ? `, protected reserve ${whole(get("reserve"))}` : ""}
        {isPositive(get("held")) ? `, held liquid ${whole(get("held"))}` : ""}, deployable {whole(m.deployable)}. Together they add up to {whole(m.total)}.
      </p>
    </>
  );
}

export const DOC_PAGES: DocPage[] = [
  {
    slug: "getting-started",
    group: "Start",
    title: "Getting started",
    description: "Set up an organization, add accounts read-only, record obligations and choose a policy.",
    body: () => (
      <>
        <p>
          TokenIQ needs three things to answer “how much can we safely deploy?”: what you hold, what you owe, and the rules your team agrees on. None of them require a key or a signature.
        </p>
        <h2 id="before">Before you start</h2>
        <ul>
          <li>An email address to sign in with. Sign-in uses a one-time code; you can add a passkey later.</li>
          <li>The addresses of the Safes or wallets that hold your treasury, on Ethereum, Base, Arbitrum One or OP Mainnet.</li>
          <li>A rough list of upcoming payments: payroll, vendors, grants, invoices.</li>
        </ul>
        <p>
          Want to look around first? Open the <strong>sample workspace</strong> from onboarding. It is filled with example data and clearly labelled as such.
        </p>
        <h2 id="steps">Set up in seven steps</h2>
        <ol>
          <li>
            <strong>Create your organization.</strong> You become its owner.
          </li>
          <li>
            <strong>Add accounts.</strong> Paste a Safe or wallet address and choose its network. TokenIQ reads balances straight away. Nothing is signed and nothing moves.
          </li>
          <li>
            <strong>Verify control.</strong> Sign a message with an owner’s wallet to prove the account is yours. Until then it is tracked but excluded from reserve and deployable maths.
          </li>
          <li>
            <strong>Record obligations.</strong> Add each commitment with its amount, due date, how often it repeats and how certain it is (estimate, committed or invoiced).
          </li>
          <li>
            <strong>Choose a policy.</strong> Start from a preset and adjust it (see below).
          </li>
          <li>
            <strong>Read the Overview.</strong> It shows what is protected, what is owed and what is deployable, with “How this is calculated” under every figure.
          </li>
          <li>
            <strong>Invite your team and set approvals.</strong> Give each person a role and decide how many approvals each amount needs.
          </li>
        </ol>
        <h2 id="presets">Policy presets</h2>
        <table>
          <thead>
            <tr>
              <th scope="col">Preset</th>
              <th scope="col">What it protects</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(POLICY_PRESETS).map((p) => (
              <tr key={p.label}>
                <td>
                  <strong>{p.label}</strong>
                </td>
                <td>{p.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          Next: read how the <Link href="/docs/reserve">protected reserve</Link> is calculated.
        </p>
      </>
    ),
  },
  {
    slug: "reserve",
    group: "Concepts",
    title: "The protected reserve",
    description: "The amount your policy keeps liquid: the strictest of a fixed floor, months of runway, and obligations in the horizon.",
    body: () => (
      <>
        <p>
          The protected reserve is the money your policy says must stay liquid and untouched. TokenIQ never recommends deploying it.
        </p>
        <h2 id="rules">The requirement is the strictest rule</h2>
        <p>Three rules each produce an amount. The requirement is the largest of the rules that are switched on:</p>
        <ul>
          <li>
            <strong>Fixed floor</strong>: a minimum in US dollars. Zero switches it off.
          </li>
          <li>
            <strong>Operating runway</strong>: months of runway × monthly burn. Burn is the higher of the figure you declare and your recorded recurring costs, so an out-of-date estimate cannot understate it.
          </li>
          <li>
            <strong>Obligations in the horizon</strong>: everything unpaid and due within the horizon (30 to 365 days), including recent overdue items, plus a buffer such as 10%.
          </li>
        </ul>
        <p>
          Because the rules are not added together, an invoice that falls inside your runway does not reduce what is deployable: the runway rule already covered it. It does move money from “protected reserve” into “upcoming obligations”, which the allocation bar shows.
        </p>
        <h2 id="eligible">What counts toward the reserve</h2>
        <ul>
          <li>Only stablecoins held liquid in included accounts. Positions already deployed and non-stable assets never count.</li>
          <li>USD stablecoins are valued at the oracle price but never above $1. A haircut set in your policy reduces the value further.</li>
          <li>Accounts whose control has not been verified are excluded unless your policy explicitly includes them.</li>
          <li>Expected inflows are shown but never reduce the requirement.</li>
        </ul>
        <h2 id="coverage">Coverage</h2>
        <p>
          Coverage compares reserve-eligible capital (after pending proposals) with the requirement. Below 100% the reserve is <strong>short</strong>; below your thin-coverage threshold (default {formatBps(DEFAULT_TREASURY_POLICY.thinCoverageBps, 0)}) it is <strong>thin</strong>; otherwise it is <strong>covered</strong>.
        </p>
        <p>
          If inputs are missing (no burn estimate, a price without a recent update, an account never synced), the figures carry an uncertainty level and say why.
        </p>
      </>
    ),
  },
  {
    slug: "obligations",
    group: "Concepts",
    title: "Obligations",
    description: "How commitments become dated payments, and why an estimate is not an invoice.",
    body: () => (
      <>
        <p>An obligation is anything your organization has to pay (or expects to receive): payroll, vendors, grants, debt service, invoices.</p>
        <h2 id="fields">What you record</h2>
        <table>
          <tbody>
            <tr>
              <td>Amount and currency</td>
              <td>Per occurrence, in USD or EUR. EUR is converted at a recorded rate, rounded up for payments.</td>
            </tr>
            <tr>
              <td>First due date and recurrence</td>
              <td>Once, weekly, monthly, quarterly or yearly, every N periods, optionally until a date or for a number of times.</td>
            </tr>
            <tr>
              <td>Certainty</td>
              <td>
                <strong>Estimate</strong> (expected, not agreed), <strong>committed</strong> (agreed: payroll, a contract) or <strong>invoiced</strong> (an invoice someone has checked).
              </td>
            </tr>
            <tr>
              <td>Priority and status</td>
              <td>Priority orders what matters most; paused or cancelled obligations stop counting.</td>
            </tr>
          </tbody>
        </table>
        <h2 id="occurrences">From obligations to payments</h2>
        <p>
          TokenIQ expands each obligation into dated occurrences within your horizon. An occurrence stops counting once it is <strong>settled</strong>: paid (matched to an on-chain transfer, or recorded) or skipped. Unpaid occurrences from the last 30 days count as
          overdue and stay in the requirement.
        </p>
        <h2 id="states">Planned is not invoiced is not paid</h2>
        <p>
          These states are kept apart everywhere. Your policy decides whether estimates count toward the reserve (they do by default). Payments are only called paid when there is evidence.
        </p>
        <h2 id="currency">Currency mismatches</h2>
        <p>If euro obligations in the horizon exceed your euro stablecoin holdings, TokenIQ warns that paying them will need a conversion at a future rate.</p>
      </>
    ),
  },
  {
    slug: "deployable-surplus",
    group: "Concepts",
    title: "Deployable surplus",
    description: "What may be allocated to vetted venues, with approval, after the reserve and every limit.",
    body: () => (
      <>
        <p>Deployable surplus is the part of the treasury your policy allows to be put to work. It is a ceiling, not a recommendation to deploy all of it.</p>
        <h2 id="formula">Formula</h2>
        <p>
          <code>deployable = max(0, min(reserve-eligible − requirement − pending, gross × max deployed − already deployed − pending allocations))</code>
        </p>
        <ul>
          <li>
            <strong>Pending</strong> means allocation and payment proposals that are still active: awaiting internal approval, Safe signatures or execution. They are treated as already spent so the same money is never proposed twice.
          </li>
          <li>
            <strong>Max deployed</strong> caps the share of the whole treasury that may sit in protocols (default {formatBps(DEFAULT_TREASURY_POLICY.maxDeployedBps, 0)}).
          </li>
        </ul>
        <h2 id="held">Held liquid</h2>
        <p>When the cap is the tighter limit, the difference stays liquid. The allocation bar shows it as “held liquid”: not required by the reserve, but not deployable either.</p>
        <h2 id="per-venue">Per-venue limits</h2>
        <p>
          Recommendations also respect per-protocol (default {formatBps(DEFAULT_TREASURY_POLICY.maxPerProtocolBps, 0)}) and per-venue (default {formatBps(DEFAULT_TREASURY_POLICY.maxPerVenueBps, 0)}) caps, a minimum venue size (default{" "}
          {whole(DEFAULT_TREASURY_POLICY.minVenueTvlUsd)}), a maximum fee, and a limit on your position as a share of the venue’s available liquidity (default {formatBps(DEFAULT_TREASURY_POLICY.maxShareOfVenueLiquidityBps, 0)}).
        </p>
      </>
    ),
  },
  {
    slug: "policies",
    group: "Concepts",
    title: "Policies",
    description: "The rules your team agrees on: reserve, valuation, allocation limits and approvals. Every change is versioned.",
    body: () => {
      const p = DEFAULT_TREASURY_POLICY;
      const rows: Array<[string, string, string]> = [
        ["Runway months", "Months of operating spend to protect (0 switches it off)", `${p.runwayMonths}`],
        ["Monthly burn", "Your declared operating spend; the engine uses the higher of this and recurring obligations", "Not set"],
        ["Minimum reserve", "A fixed floor in USD", whole(p.minimumReserveUsd)],
        ["Obligation horizon", "Days ahead whose payments must be covered", `${p.obligationHorizonDays} days`],
        ["Obligation buffer", "Extra cover on top of obligations", formatBps(p.obligationBufferBps, 0)],
        ["Include estimates", "Count estimated obligations, not only committed and invoiced", p.includeEstimatedObligations ? "Yes" : "No"],
        ["Haircuts", "Per-stablecoin discount for reserve purposes", "None"],
        ["Include unverified accounts", "Count accounts whose control is not proven", p.includeUnverifiedInReserve ? "Yes" : "No"],
        ["Maximum data age", "Older balances are flagged stale", `${p.maxDataAgeMinutes} minutes`],
        ["Max deployed", "Share of the treasury that may be in protocols", formatBps(p.maxDeployedBps, 0)],
        ["Per protocol / per venue", "Concentration caps", `${formatBps(p.maxPerProtocolBps, 0)} / ${formatBps(p.maxPerVenueBps, 0)}`],
        ["Max venue fee", "Highest acceptable venue fee", formatBps(p.maxVenueFeeBps, 0)],
        ["Allowed assets and protocols", "What may be used", `${p.allowedAssets.join(", ")} · Morpho, Aave v3`],
        ["Minimum action", "Smaller moves are not recommended", whole(p.minActionUsd)],
      ];
      return (
        <>
          <p>A policy is a short list of deterministic rules. Nothing in it is interpreted by a language model. Changing it creates a new version; recommendations and approvals record the version they were checked against.</p>
          <h2 id="treasury-policy">Treasury policy (defaults)</h2>
          <table>
            <thead>
              <tr>
                <th scope="col">Setting</th>
                <th scope="col">Meaning</th>
                <th scope="col">Default</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([a, b, c]) => (
                <tr key={a}>
                  <td>{a}</td>
                  <td>{b}</td>
                  <td className="num">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h2 id="autonomy">Autonomy</h2>
          <ul>
            <li>
              <strong>Observe</strong>: for teams that want monitoring and analysis only.
            </li>
            <li>
              <strong>Approval required</strong> (default): every action needs internal approval and Safe signatures.
            </li>
            <li>
              <strong>Bounded automation</strong>: planned, not available. It would rely on narrowly scoped on-chain permissions.
            </li>
          </ul>
          <h2 id="approval-policy">Approval policy (defaults)</h2>
          <ul>
            {DEFAULT_APPROVAL_POLICY.tiers.map((t, i) => (
              <li key={i}>
                {t.upToUsd ? `Up to ${whole(t.upToUsd)}` : "Above the last tier"}: {t.requiredApprovals} approval{t.requiredApprovals === 1 ? "" : "s"}
                {t.requiredRole ? `, including an ${t.requiredRole}` : ""}.
              </li>
            ))}
            <li>Self-approval is {DEFAULT_APPROVAL_POLICY.allowSelfApproval ? "allowed" : "not allowed"}.</li>
            <li>Proposals expire after {DEFAULT_APPROVAL_POLICY.proposalTtlHours} hours without full approval.</li>
          </ul>
        </>
      );
    },
  },
  {
    slug: "approvals-signatures-execution",
    group: "Concepts",
    title: "Approvals, signatures and execution",
    description: "Three separate tracks with separate states. An approval is not a signature, and a signature is not execution.",
    body: () => (
      <>
        <p>Every action that moves funds is a proposal. A proposal advances along three tracks, and TokenIQ reports each one separately.</p>
        <h2 id="checks">0. Deterministic checks</h2>
        <p>Before anyone is asked to approve, the policy engine checks that the reserve stays covered after the action, limits and allow-lists are respected, and data is fresh. Checks run again before signing.</p>
        <h2 id="approval">1. Internal approval</h2>
        <p>Members with approval rights approve or reject in TokenIQ. The number of approvals depends on the amount tier. Approval states are pending, approved, rejected, expired or cancelled.</p>
        <h2 id="signatures">2. Safe signatures</h2>
        <p>
          TokenIQ prepares the exact Safe transaction and shows what it does. Safe owners sign it in their own wallets. Signatures are checked against the Safe’s current owners; the Safe enforces its threshold. TokenIQ is never an owner.
        </p>
        <h2 id="execution">3. On-chain execution</h2>
        <p>Once the threshold is met, any signer submits the transaction from their wallet. It is simulated first. TokenIQ records the transaction hash and reads the Safe’s execution event.</p>
        <h2 id="reconciliation">Reconciliation</h2>
        <p>Submitting is not success. TokenIQ tracks the transaction receipt and the Safe’s execution event until it is confirmed, then refreshes balances and positions. A failed execution is shown as failed, never as a success.</p>
        <h2 id="cancel">Cancelling</h2>
        <p>A proposal can be cancelled, with a reason, until it has been submitted on-chain.</p>
      </>
    ),
  },
  {
    slug: "calculation-reference",
    group: "Reference",
    title: "Calculation reference",
    description: "Every formula, rounding rule and a worked example computed by the engine.",
    body: () => (
      <>
        <p>
          All arithmetic uses exact fixed-point decimals (18 places), never floating point. Requirements round <strong>up</strong>; availability rounds <strong>down</strong>.
        </p>
        <h2 id="formulas">Formulas</h2>
        <table>
          <tbody>
            <tr>
              <td>Reserve value of a stablecoin</td>
              <td>
                <code>amount × min(price, 1.00) − haircut</code> (USD stablecoins)
              </td>
            </tr>
            <tr>
              <td>Monthly burn</td>
              <td>
                <code>max(declared burn, recurring obligations per month)</code>; weekly items use 52/12 weeks per month
              </td>
            </tr>
            <tr>
              <td>Runway rule</td>
              <td>
                <code>runway months × monthly burn</code>
              </td>
            </tr>
            <tr>
              <td>Obligations rule</td>
              <td>
                <code>unpaid outflows due in the horizon (incl. overdue) × (1 + buffer)</code>
              </td>
            </tr>
            <tr>
              <td>Requirement</td>
              <td>
                <code>max(floor, runway rule, obligations rule)</code> over enabled rules
              </td>
            </tr>
            <tr>
              <td>Coverage</td>
              <td>
                <code>(reserve-eligible − pending) ÷ requirement</code>
              </td>
            </tr>
            <tr>
              <td>Deployable</td>
              <td>
                <code>max(0, min(reserve-eligible − requirement − pending, gross × max deployed − deployed − pending allocations))</code>
              </td>
            </tr>
          </tbody>
        </table>
        <h2 id="example">Worked example</h2>
        <p>
          The illustrative treasury from the home page: two Safes holding 1,250,000 USDC, a declared burn of $80,000 a month, a $200,000 floor, a 10% buffer and an 80% deployment cap. Obligations: payroll $52,000 monthly, infrastructure $9,000
          monthly, a $18,000 legal invoice, a $40,000 grant tranche and a $15,000 event estimate. These figures are computed by the engine when this page is built.
        </p>
        <WorkedExample inputs={DEFAULT_INPUTS} caption="Example A · 6 months of runway, 90-day horizon" />
        <WorkedExample inputs={{ ...DEFAULT_INPUTS, events: { audit: false, contractors: false, depeg: true } }} caption="Example B · the same policy with USDC at $0.97" />
        <WorkedExample inputs={{ ...DEFAULT_INPUTS, runwayMonths: 3, horizonDays: 30 }} caption="Example C · 3 months of runway, 30-day horizon (the cap binds)" />
        <h2 id="buckets">The allocation bar</h2>
        <p>
          The bar splits reserve-eligible capital into parts that add up exactly: upcoming obligations (the obligations rule, capped at the requirement), protected reserve (the rest of the requirement), deployable surplus, and held liquid. A shortfall is shown
          separately, because it is money that is missing rather than money that is held.
        </p>
      </>
    ),
  },
  {
    slug: "faq",
    group: "Help",
    title: "Frequently asked questions",
    description: "Custody, execution, data sources, the copilot, audits and pricing.",
    body: () => (
      <>
        <Faq q="Does TokenIQ hold our funds or keys?">No. TokenIQ never holds private keys or seed phrases and is never an owner of your Safe. Funds stay in your accounts.</Faq>
        <Faq q="Can TokenIQ move funds on its own?">
          No. Every action needs your team’s internal approval and your Safe owners’ signatures, made in their own wallets. A signer submits the transaction.
        </Faq>
        <Faq q="Which networks and assets are supported?">
          Ethereum, Base, Arbitrum One and OP Mainnet, plus Sepolia and Base Sepolia for testing. Stablecoins such as USDC, USDT, DAI, USDS and EURC are recognised where they exist on each network. See <Link href="/integrations">integrations</Link>.
        </Faq>
        <Faq q="Why did adding an invoice not change the deployable figure?">
          The requirement is the strictest of your rules, not their sum. If your runway rule already protects more than all your upcoming obligations, a new invoice moves money from protected reserve into obligations without changing what is deployable.
        </Faq>
        <Faq q="Why is a stablecoin trading above $1 counted as $1?">For the reserve, USD stablecoins are never valued above their peg. Below the peg, the lower market price is used.</Faq>
        <Faq q="What happens when a price or balance is stale?">The figure is flagged, its confidence drops, and stale data can block a proposal. TokenIQ never presents stale data as current.</Faq>
        <Faq q="Is the copilot giving investment advice?">
          No. It explains your own records and policy, with citations. It can be wrong, it cannot act, and it is not a financial adviser. Recommendations come from the deterministic policy engine.
        </Faq>
        <Faq q="Has TokenIQ been audited?">
          Not independently. The code has had an internal self-review by the team that wrote it. See <Link href="/security">security</Link> for the model and known limitations.
        </Faq>
        <Faq q="What does it cost?">
          TokenIQ is free during early access. See <Link href="/pricing">pricing</Link>.
        </Faq>
        <Faq q="Can we try it without connecting anything?">Yes. Open the sample workspace during onboarding. It uses example data and is labelled as such.</Faq>
      </>
    ),
  },
];

function Faq({ q, children }: { q: string; children: ReactNode }) {
  return (
    <>
      <h2>{q}</h2>
      <p>{children}</p>
    </>
  );
}

export function getDoc(slug: string): DocPage | undefined {
  return DOC_PAGES.find((d) => d.slug === slug);
}
