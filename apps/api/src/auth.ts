import { passkey } from "@better-auth/passkey";
import { schema, type Database } from "@tokeniq/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins/email-otp";
import { siwe } from "better-auth/plugins/siwe";
import { generateSiweNonce, parseSiweMessage, validateSiweMessage } from "viem/siwe";
import type { Env } from "./env.js";
import type { Mailer } from "./lib/mailer.js";
import type { PublicClientFor } from "./services/chains.js";

/**
 * Identity only: email one-time codes, passkeys and Sign-In with Ethereum.
 * Signing in with a wallet proves control of an address for login purposes; it
 * does NOT make that wallet an organization treasury (see account verification).
 * Organizations, roles and invitations are handled by TokenIQ's own modules.
 */
export function createAuth(db: Database, env: Env, mailer: Mailer, publicClient: PublicClientFor) {
  const appUrl = new URL(env.APP_URL);
  return betterAuth({
    appName: "TokenIQ",
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.API_PUBLIC_URL,
    basePath: "/api/auth",
    trustedOrigins: [env.APP_URL],
    database: drizzleAdapter(db, {
      provider: "pg",
      usePlural: true,
      schema: {
        users: schema.users,
        sessions: schema.sessions,
        accounts: schema.accounts,
        verifications: schema.verifications,
        passkeys: schema.passkeys,
        // Better Auth pluralises model names by appending "s".
        walletAddresss: schema.walletAddresses,
      },
    }),
    emailAndPassword: { enabled: false },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 12,
      // Short cache so revoked sessions stop working within a minute.
      cookieCache: { enabled: true, maxAge: 60 },
    },
    rateLimit: {
      enabled: env.NODE_ENV !== "test",
      window: 60,
      max: 60,
      customRules: {
        "/email-otp/send-verification-otp": { window: 60, max: 5 },
        "/sign-in/email-otp": { window: 60, max: 10 },
        "/siwe/nonce": { window: 60, max: 20 },
        "/siwe/verify": { window: 60, max: 10 },
      },
    },
    advanced: {
      database: { generateId: () => crypto.randomUUID() },
      useSecureCookies: env.NODE_ENV === "production",
      cookiePrefix: "tokeniq",
      defaultCookieAttributes: { sameSite: "lax", httpOnly: true },
    },
    plugins: [
      emailOTP({
        otpLength: 6,
        expiresIn: 10 * 60,
        allowedAttempts: 5,
        storeOTP: "hashed",
        async sendVerificationOTP({ email, otp, type }) {
          const purpose = type === "sign-in" ? "sign in to" : "verify your email for";
          await mailer.send({
            to: email,
            subject: `${otp} is your TokenIQ code`,
            text: `Use ${otp} to ${purpose} TokenIQ. The code expires in 10 minutes.\n\nIf you did not request this, you can ignore this email. TokenIQ will never ask you for this code by phone or chat.`,
          });
        },
      }),
      passkey({
        rpID: appUrl.hostname,
        rpName: "TokenIQ",
        origin: env.APP_URL,
      }),
      siwe({
        domain: appUrl.host,
        emailDomainName: "wallet.tokeniq.invalid",
        anonymous: true,
        getNonce: async () => generateSiweNonce(),
        async verifyMessage({ message, signature, address, chainId }) {
          const parsed = parseSiweMessage(message);
          // Domain binding, expiry and address checks (replay across sites or after expiry is rejected).
          if (!validateSiweMessage({ message: parsed, domain: appUrl.host, address: address as `0x${string}` })) return false;
          if (parsed.chainId !== chainId) return false;
          const client = publicClient(chainId);
          if (!client) return false;
          // verifyMessage handles EOAs and smart-contract wallets (ERC-1271 / ERC-6492).
          return client.verifyMessage({ address: address as `0x${string}`, message, signature: signature as `0x${string}` });
        },
      }),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
