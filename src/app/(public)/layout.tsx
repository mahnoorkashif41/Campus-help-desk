import { SiteHeader } from "@/components/site-header";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">{children}</main>
      <footer className="mx-auto max-w-5xl px-4 pb-10 text-xs text-muted">
        Campus Helpdesk is an academic project. Complaint details are visible only to the campus administrator.
      </footer>
    </>
  );
}
