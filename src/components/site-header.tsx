import Link from "next/link";
import { LifeBuoy } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <LifeBuoy className="size-6 text-brand" aria-hidden /> Campus Helpdesk
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 text-sm font-medium">
          <Link href="/submit" className="rounded-lg px-3 py-2 hover:bg-brand-soft">Report an issue</Link>
          <Link href="/track" className="rounded-lg px-3 py-2 hover:bg-brand-soft">Track a complaint</Link>
          <Link href="/admin/login" className="rounded-lg px-3 py-2 text-muted hover:bg-brand-soft">Admin</Link>
        </nav>
      </div>
    </header>
  );
}
