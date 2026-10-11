import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DOC_PAGES, getDoc } from "@/components/marketing/docs-content";
import { pageMetadata } from "@/lib/marketing-site";

export const dynamicParams = false;

export function generateStaticParams() {
  return DOC_PAGES.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDoc(slug);
  if (!doc) return {};
  return pageMetadata({ title: `${doc.title} · Docs`, description: doc.description, path: `/docs/${doc.slug}` });
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = getDoc(slug);
  if (!doc) notFound();
  const i = DOC_PAGES.indexOf(doc);
  const prev = DOC_PAGES[i - 1];
  const next = DOC_PAGES[i + 1];
  return (
    <article>
      <nav aria-label="Breadcrumb" className="text-xs text-text-3">
        <Link href="/docs" className="hover:text-text">
          Docs
        </Link>{" "}
        / <span>{doc.group}</span>
      </nav>
      <h1 className="mt-3 text-[32px] font-medium leading-[38px] tracking-[-0.02em] text-text sm:text-[40px] sm:leading-[46px]">{doc.title}</h1>
      <p className="mt-3 max-w-2xl text-[16px] leading-7 text-text-2">{doc.description}</p>
      <div className="mk-prose mt-8 max-w-[70ch] border-t border-hairline pt-6">{doc.body()}</div>
      <nav aria-label="Previous and next" className="mt-14 grid gap-3 border-t border-hairline pt-6 sm:grid-cols-2">
        {prev ? (
          <Link href={`/docs/${prev.slug}`} className="group rounded-[var(--radius-card)] border border-hairline bg-surface p-4 hover:bg-sunken">
            <span className="flex items-center gap-1 text-xs text-text-3">
              <ArrowLeft className="size-3.5" aria-hidden="true" /> Previous
            </span>
            <span className="mt-1 block text-[14px] font-medium text-text">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/docs/${next.slug}`} className="group rounded-[var(--radius-card)] border border-hairline bg-surface p-4 text-right hover:bg-sunken">
            <span className="flex items-center justify-end gap-1 text-xs text-text-3">
              Next <ArrowRight className="size-3.5" aria-hidden="true" />
            </span>
            <span className="mt-1 block text-[14px] font-medium text-text">{next.title}</span>
          </Link>
        )}
      </nav>
    </article>
  );
}
