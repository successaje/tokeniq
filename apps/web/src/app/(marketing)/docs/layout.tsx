import { Container } from "@/components/marketing/primitives";
import { DocsNav } from "@/components/marketing/docs-nav";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Container className="grid gap-10 pb-24 pt-10 lg:grid-cols-12 lg:gap-8 lg:pt-14">
      <aside className="lg:col-span-3">
        <div className="lg:sticky lg:top-24">
          <DocsNav />
        </div>
      </aside>
      <div className="min-w-0 lg:col-span-9 xl:col-span-8">{children}</div>
    </Container>
  );
}
