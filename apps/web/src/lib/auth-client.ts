"use client";

import { passkeyClient } from "@better-auth/passkey/client";
import { createAuthClient } from "better-auth/react";
import { emailOTPClient, siweClient } from "better-auth/client/plugins";

/** Better Auth client. Identity only; organizations and roles come from the TokenIQ API. */
export const authClient = createAuthClient({
  basePath: "/api/auth",
  plugins: [emailOTPClient(), passkeyClient(), siweClient()],
});
