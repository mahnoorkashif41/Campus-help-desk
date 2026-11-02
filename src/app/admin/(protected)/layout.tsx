import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { LogoutButton } from "@/components/admin/logout-button";
import { requireAdminPage } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Second layer of protection (the first is src/middleware.ts).
  await requireAdminPage();

  return (
    <div className="min-h-screen md:grid md:grid-cols-[14rem_1fr]">
      <aside className="flex flex-wrap items-center justify-between gap-3 bg-ink p-3 md:flex-col md:items-stretch md:justify-start md:gap-6 md:p-4">
        <Link href="/admin" className="flex items-center gap-2 px-2 font-bold text-white"><LifeBuoy className="size-5" aria-hidden /> Helpdesk Admin</Link>
        <AdminNav />
        <LogoutButton />
      </aside>
      <main className="min-w-0 p-4 sm:p-8">{children}</main>
    </div>
  );
}