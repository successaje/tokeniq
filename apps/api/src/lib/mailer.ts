import nodemailer from "nodemailer";
import type { Logger } from "./logger.js";

export interface Mail {
  to: string;
  subject: string;
  text: string;
}

export interface Mailer {
  send(mail: Mail): Promise<void>;
  /** Only populated in test mode so end-to-end tests can read one-time codes. */
  outbox: Mail[];
  configured: boolean;
}

export function createMailer(opts: { smtpUrl?: string; from: string; nodeEnv: string; logger: Logger }): Mailer {
  const outbox: Mail[] = [];
  if (!opts.smtpUrl) {
    return {
      outbox,
      configured: false,
      async send(mail) {
        if (opts.nodeEnv === "production") throw new Error("Email is not configured (SMTP_URL is missing)");
        outbox.push(mail);
        if (outbox.length > 200) outbox.shift();
        // Development convenience: the message body is printed so you can sign in without SMTP.
        if (opts.nodeEnv === "development") opts.logger.info({ to: mail.to, subject: mail.subject }, `DEV EMAIL\n${mail.text}`);
      },
    };
  }
  const transport = nodemailer.createTransport(opts.smtpUrl);
  return {
    outbox,
    configured: true,
    async send(mail) {
      await transport.sendMail({ from: opts.from, to: mail.to, subject: mail.subject, text: mail.text });
    },
  };
}
