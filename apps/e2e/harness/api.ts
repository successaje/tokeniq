/**
 * End-to-end harness for the API: a clean database, a local SMTP sink, and the
 * real API process configured to send mail to that sink. Sign-in codes travel
 * the same path as production email; the API has no test-only endpoints.
 *
 * Mail sink:  smtp://127.0.0.1:2526
 * Read back: GET http://127.0.0.1:2527/codes/<email>  (latest six-digit code)
 *            GET http://127.0.0.1:2527/mail/<email>   (latest message: subject and decoded body)
 */
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { SMTPServer } from "smtp-server";
import { E2E } from "./ports.js";

const DATABASE_URL = process.env.E2E_DATABASE_URL ?? "postgres://localhost:5432/tokeniq_e2e";

async function resetDatabase() {
  const url = new URL(DATABASE_URL);
  const name = url.pathname.slice(1);
  if (!/^[a-z0-9_]+$/.test(name) || !name.includes("e2e")) throw new Error(`Refusing to reset "${name}": the e2e database name must contain "e2e".`);
  const admin = postgres({ ...pgOptions(url), database: "postgres", max: 1 });
  const [exists] = await admin`select 1 from pg_database where datname = ${name}`;
  if (!exists) await admin.unsafe(`create database ${name}`);
  await admin.end();
  const db = postgres(DATABASE_URL, { max: 1, onnotice: () => undefined });
  await db.unsafe("drop schema if exists public cascade; drop schema if exists drizzle cascade; drop schema if exists pgboss cascade; create schema public;");
  await db.end();
}

function pgOptions(url: URL) {
  return { host: url.hostname, port: Number(url.port || 5432), username: decodeURIComponent(url.username) || undefined, password: decodeURIComponent(url.password) || undefined };
}

const codes = new Map<string, string>();
const lastMail = new Map<string, { subject: string; body: string }>();

/** Enough MIME for our own plain-text messages: split headers, undo quoted-printable. */
function decodeBody(raw: string): string {
  const [head, ...rest] = raw.split(/\r?\n\r?\n/);
  const body = rest.join("\n\n");
  if (!/content-transfer-encoding:\s*quoted-printable/i.test(head ?? "")) return body;
  return body.replace(/=\r?\n/g, "").replace(/=([0-9A-F]{2})/gi, (_m, hex: string) => String.fromCharCode(parseInt(hex, 16)));
}

function startMailSink() {
  const smtp = new SMTPServer({
    authOptional: true,
    disabledCommands: ["STARTTLS", "AUTH"],
    logger: false,
    onData(stream, session, callback) {
      let raw = "";
      stream.setEncoding("utf8");
      stream.on("data", (chunk: string) => (raw += chunk));
      stream.on("end", () => {
        const subject = /^Subject: (.*)$/im.exec(raw)?.[1] ?? "";
        const body = decodeBody(raw);
        // Sign-in emails carry the code in the subject; other mail (invitations) must not overwrite it.
        const code = /\b(\d{6})\b/.exec(subject)?.[1];
        for (const rcpt of session.envelope.rcptTo) {
          const to = rcpt.address.toLowerCase();
          lastMail.set(to, { subject, body });
          if (code) codes.set(to, code);
        }
        callback();
      });
    },
  });
  smtp.listen(E2E.smtpPort, "127.0.0.1");
  createServer((req, res) => {
    const match = /^\/(codes|mail)\/(.+)$/.exec(req.url ?? "");
    const to = match ? decodeURIComponent(match[2]!).toLowerCase() : "";
    const found = match?.[1] === "codes" ? (codes.has(to) ? { code: codes.get(to) } : null) : (lastMail.get(to) ?? null);
    res.writeHead(found ? 200 : 404, { "content-type": "application/json" }).end(JSON.stringify(found ?? { error: "nothing received" }));
  }).listen(E2E.codesPort, "127.0.0.1");
}

await resetDatabase();
startMailSink();
const apiDir = fileURLToPath(new URL("../../api/", import.meta.url));
const api = spawn("pnpm", ["exec", "tsx", "src/server.ts"], {
  cwd: apiDir,
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_ENV: "development",
    PORT: String(E2E.apiPort),
    DATABASE_URL,
    APP_URL: E2E.webUrl,
    API_PUBLIC_URL: E2E.webUrl,
    BETTER_AUTH_SECRET: "e2e-secret-e2e-secret-e2e-secret-0123456789",
    SMTP_URL: `smtp://127.0.0.1:${E2E.smtpPort}`,
    EMAIL_FROM: "TokenIQ E2E <e2e@tokeniq.local>",
    MIGRATE_ON_BOOT: "true",
    // No background jobs: no network reads, so runs are deterministic and offline.
    RUN_JOBS: "false",
    // One person drives dozens of page loads a minute across the journeys; production keeps the default.
    API_RATE_LIMIT_PER_MINUTE: "5000",
    LOG_LEVEL: "warn",
    ANTHROPIC_API_KEY: "",
    DEV_EXTRA_ORIGINS: "",
  },
});
for (const sig of ["SIGINT", "SIGTERM"] as const) process.on(sig, () => api.kill(sig));
api.on("exit", (code) => process.exit(code ?? 0));
