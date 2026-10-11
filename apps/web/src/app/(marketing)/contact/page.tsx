import { Mail, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Container, PageIntro } from "@/components/marketing/primitives";
import { StatusBadge } from "@/components/ui/status";
import { contactEmails, pageMetadata } from "@/lib/marketing-site";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description: "How to reach the TokenIQ team about the product, early access, or a security issue.",
  path: "/contact",
});

export default function ContactPage() {
  const { contact, security } = contactEmails();
  return (
    <>
      <PageIntro eyebrow="Contact" title="Talk to the people who build TokenIQ." lead="Email is the best way to reach us. We read everything, and we never ask for keys, seed phrases or payment details." />
      <Container className="pb-24 pt-10">
        <div className="grid gap-4 md:grid-cols-2">
          <Channel icon={Mail} title="Product and early access" text="Questions, feedback, onboarding help, or a calculation that looks wrong." email={contact} envVar="NEXT_PUBLIC_CONTACT_EMAIL" placeholder="contact@" />
          <Channel icon={ShieldAlert} title="Security" text={<>Report a vulnerability privately. Please read the <Link href="/security#disclosure" className="text-accent underline underline-offset-2">disclosure guidelines</Link> first.</>} email={security} envVar="NEXT_PUBLIC_SECURITY_EMAIL" placeholder="security@" />
        </div>
        <div className="mt-12 grid gap-6 border-t border-hairline pt-8 text-[14px] leading-6 text-text-2 md:grid-cols-3">
          <p>
            <span className="font-medium text-text">Is something down?</span> Check{" "}
            <Link href="/status" className="text-accent underline underline-offset-2">
              system status
            </Link>{" "}
            first.
          </p>
          <p>
            <span className="font-medium text-text">How does a figure work?</span> The{" "}
            <Link href="/docs/calculation-reference" className="text-accent underline underline-offset-2">
              calculation reference
            </Link>{" "}
            explains every formula.
          </p>
          <p>
            <span className="font-medium text-text">Common questions</span> are answered in the{" "}
            <Link href="/docs/faq" className="text-accent underline underline-offset-2">
              FAQ
            </Link>
            .
          </p>
        </div>
      </Container>
    </>
  );
}

function Channel({ icon: Icon, title, text, email, envVar, placeholder }: { icon: typeof Mail; title: string; text: ReactNode; email: string | null; envVar: string; placeholder: string }) {
  return (
    <section className="flex flex-col rounded-[var(--radius-card)] border border-hairline bg-surface p-5">
      <Icon className="size-5 text-accent" aria-hidden="true" />
      <h2 className="mt-4 text-[17px] font-semibold text-text">{title}</h2>
      <p className="mt-1 flex-1 text-[14px] leading-6 text-text-2">{text}</p>
      <div className="mt-6 border-t border-hairline pt-4">
        {email ? (
          <a href={`mailto:${email}`} className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-control)] bg-accent px-4 text-[14px] font-medium text-on-accent hover:bg-accent-hover">
            <Mail className="size-4" aria-hidden="true" />
            {email}
          </a>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[14px] text-text-2">{placeholder}</span>
            <StatusBadge tone="warning">Not configured</StatusBadge>
            <p className="w-full text-xs text-text-3">This deployment has not set {envVar}, so there is no address to show yet.</p>
          </div>
        )}
      </div>
    </section>
  );
}
