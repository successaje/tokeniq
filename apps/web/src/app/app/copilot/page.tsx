"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowUp, Database, MessageSquarePlus, Square } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CopilotMarkdown } from "@/components/app/copilot/markdown";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Callout } from "@/components/ui/status";
import { api, orgPath } from "@/lib/api";
import { cn } from "@/lib/cn";
import { relativeTime } from "@/lib/format";
import { useOrg, useOrgQuery } from "@/lib/org";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  tools: string[];
  pending?: boolean;
  error?: string;
}

const TOOL_LABEL: Record<string, string> = {
  get_treasury_overview: "Reading the treasury overview",
  list_obligations: "Checking obligations",
  list_accounts_and_holdings: "Reading accounts and balances",
  list_positions: "Reading positions",
  list_recommendations: "Reading recommendations",
  list_opportunities: "Comparing venues",
  list_alerts: "Checking risk alerts",
  get_policy: "Reading your policy",
  run_scenario: "Running a hypothetical scenario",
  check_allocation: "Checking an allocation against policy",
  list_proposals: "Reading proposals",
  list_recent_activity: "Reading recent activity",
};

const SUGGESTIONS = [
  "Can we afford to allocate another $20,000?",
  "What payments are due in the next two weeks?",
  "What happens to our reserve if USDT trades at $0.95?",
  "Which positions create liquidity risk?",
  "Compare our current reserve policy with a six-month runway.",
  "Why is the deployable amount what it is?",
];

export default function CopilotPage() {
  const { orgId, org } = useOrg();
  const qc = useQueryClient();
  const status = useOrgQuery<{ available: boolean; reason: string | null; model: string | null }>("/copilot/status");
  const threads = useOrgQuery<{ threads: Array<{ id: string; title: string; updatedAt: string }> }>("/copilot/threads");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [activity, setActivity] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, activity]);

  async function openThread(id: string) {
    abortRef.current?.abort();
    setThreadId(id);
    setActivity(null);
    const res = await api<{ messages: ChatMessage[] }>(orgPath(orgId, `/copilot/threads/${id}`));
    setMessages(res.messages);
  }

  function newThread() {
    abortRef.current?.abort();
    setThreadId(null);
    setMessages([]);
    setActivity(null);
    inputRef.current?.focus();
  }

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    setInput("");
    setBusy(true);
    const assistantId = crypto.randomUUID();
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", text: question, tools: [] }, { id: assistantId, role: "assistant", text: "", tools: [], pending: true }]);
    const controller = new AbortController();
    abortRef.current = controller;
    const update = (fn: (m: ChatMessage) => ChatMessage) => setMessages((all) => all.map((m) => (m.id === assistantId ? fn(m) : m)));
    try {
      const res = await fetch(orgPath(orgId, "/copilot/messages"), {
        method: "POST",
        headers: { "content-type": "application/json", accept: "text/event-stream" },
        credentials: "same-origin",
        body: JSON.stringify({ threadId: threadId ?? undefined, message: question }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error?.message ?? "The copilot is unavailable right now.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const raw of events) {
          const event = /^event: (.*)$/m.exec(raw)?.[1];
          const data = /^data: (.*)$/m.exec(raw)?.[1];
          if (!event || !data) continue;
          const payload = JSON.parse(data);
          if (event === "thread") setThreadId(payload.threadId);
          else if (event === "text") {
            setActivity(null);
            update((m) => ({ ...m, text: m.text + payload.delta }));
          } else if (event === "tool") {
            setActivity(TOOL_LABEL[payload.name] ?? "Looking up data");
            update((m) => ({ ...m, tools: [...m.tools, payload.name] }));
          } else if (event === "notice") update((m) => ({ ...m, error: payload.message }));
          else if (event === "error") update((m) => ({ ...m, error: payload.message }));
          else if (event === "done") update((m) => ({ ...m, pending: false }));
        }
      }
      update((m) => ({ ...m, pending: false }));
      qc.invalidateQueries({ queryKey: ["org", orgId, "/copilot/threads"] });
    } catch (err) {
      if ((err as Error).name === "AbortError") update((m) => ({ ...m, pending: false, error: "Stopped. Nothing was changed." }));
      else update((m) => ({ ...m, pending: false, error: (err as Error).message }));
    } finally {
      setBusy(false);
      setActivity(null);
      abortRef.current = null;
    }
  }

  const unavailable = status.data && !status.data.available;

  return (
    <div className="flex h-[calc(100dvh-8.5rem)] flex-col lg:h-[calc(100dvh-6.5rem)]">
      <PageHeader
        title="Copilot"
        description="Ask about your treasury. Answers cite the records they use. The copilot can explain and run hypothetical scenarios, but it cannot move funds, approve, or change anything."
        actions={
          <Button variant="secondary" size="sm" onClick={newThread}>
            <MessageSquarePlus className="size-4" aria-hidden="true" /> New conversation
          </Button>
        }
      />
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="hidden min-h-0 overflow-y-auto lg:block" aria-label="Conversations">
          <div className="px-1 pb-2 text-xs font-medium text-text-3">Your conversations</div>
          {threads.isLoading ? (
            <Skeleton className="h-24" />
          ) : (threads.data?.threads.length ?? 0) === 0 ? (
            <p className="px-1 text-xs text-text-3">Conversations are private to you within {org.name}.</p>
          ) : (
            <ul className="space-y-0.5">
              {threads.data!.threads.map((t) => (
                <li key={t.id}>
                  <button onClick={() => openThread(t.id)} className={cn("w-full rounded-[var(--radius-control)] px-2 py-1.5 text-left hover:bg-sunken", t.id === threadId && "bg-accent-subtle")}>
                    <span className="block truncate text-[13px] text-text">{t.title}</span>
                    <span className="block text-[11px] text-text-3">{relativeTime(t.updatedAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <Card className="flex min-h-0 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6" aria-live="polite">
            {unavailable ? (
              <div className="mx-auto max-w-lg py-8">
                <Callout tone="info" title={status.data!.reason === "disabled" ? "The copilot is temporarily disabled" : "The copilot isn't configured on this deployment"}>
                  {status.data!.reason === "disabled"
                    ? "An operator switched it off. Every figure it would use is still available in the app."
                    : "An Anthropic API key has not been set for this TokenIQ deployment. Every figure the copilot uses comes from TokenIQ's deterministic engine and is available directly:"}
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li>
                      <Link className="text-accent hover:underline" href="/app">Overview</Link>: what is deployable and why
                    </li>
                    <li>
                      <Link className="text-accent hover:underline" href="/app/reserves#scenarios">Reserves</Link>: stress scenarios such as depegs or new expenses
                    </li>
                    <li>
                      <Link className="text-accent hover:underline" href="/app/recommendations">Recommendations</Link>: policy-checked actions with full reasoning
                    </li>
                  </ul>
                </Callout>
              </div>
            ) : messages.length === 0 ? (
              <div className="mx-auto max-w-xl py-6">
                <div className="flex items-center gap-2 text-sm font-medium text-text">
                  <Database className="size-4 text-accent" aria-hidden="true" /> Grounded in {org.name}'s data
                </div>
                <p className="mt-1 text-[13px] text-text-2">The copilot reads your balances, obligations, policy, venues and alerts through read-only tools. Anything it calculates hypothetically is labelled as such.</p>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => send(s)} disabled={busy || status.isLoading} className="rounded-[var(--radius-card)] border border-hairline bg-surface px-3 py-2.5 text-left text-[13px] text-text hover:border-border-strong/60 hover:bg-sunken disabled:opacity-50">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-5">
                {messages.map((m) =>
                  m.role === "user" ? (
                    <div key={m.id} className="flex justify-end">
                      <div className="max-w-[85%] whitespace-pre-wrap rounded-[var(--radius-card)] bg-sunken px-3.5 py-2 text-[13.5px] text-text">{m.text}</div>
                    </div>
                  ) : (
                    <div key={m.id} className="space-y-2">
                      {m.tools.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {[...new Set(m.tools)].map((t) => (
                            <span key={t} className="inline-flex items-center gap-1 rounded-[var(--radius-chip)] border border-hairline px-1.5 py-0.5 text-[11px] text-text-3">
                              <Database className="size-3" aria-hidden="true" /> {TOOL_LABEL[t] ?? t}
                            </span>
                          ))}
                        </div>
                      )}
                      {m.text ? <CopilotMarkdown text={m.text} /> : m.pending ? <p className="text-[13px] text-text-3">{activity ?? "Thinking…"}</p> : null}
                      {m.pending && m.text && activity && <p className="text-xs text-text-3">{activity}…</p>}
                      {m.error && <Callout tone="warning">{m.error}</Callout>}
                    </div>
                  ),
                )}
                <div ref={endRef} />
              </div>
            )}
          </div>
          <form
            className="border-t border-hairline p-3"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <div className="flex items-end gap-2">
              <label htmlFor="copilot-input" className="sr-only">
                Ask the copilot
              </label>
              <textarea
                id="copilot-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                rows={1}
                maxLength={4000}
                disabled={!!unavailable}
                placeholder={unavailable ? "Copilot unavailable" : "Ask about reserves, obligations, venues or risk…"}
                className="max-h-40 min-h-10 flex-1 resize-none rounded-[var(--radius-control)] border border-border-strong/50 bg-surface px-3 py-2 text-sm text-text placeholder:text-text-3 focus-visible:outline-2 focus-visible:outline-[var(--focus)] disabled:bg-sunken"
              />
              {busy ? (
                <Button type="button" variant="secondary" size="icon" onClick={() => abortRef.current?.abort()} aria-label="Stop generating">
                  <Square className="size-4" aria-hidden="true" />
                </Button>
              ) : (
                <Button type="submit" size="icon" disabled={!input.trim() || !!unavailable} aria-label="Send">
                  <ArrowUp className="size-4" aria-hidden="true" />
                </Button>
              )}
            </div>
            <p className="mt-1.5 px-1 text-[11px] text-text-3">Analysis only, not financial advice. Verify figures against the cited records before acting.</p>
          </form>
        </Card>
      </div>
    </div>
  );
}
