import type { Metadata } from "next";
import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Admin login" };

// This page lives OUTSIDE the (protected) group on purpose: it must always be publicly reachable.
export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <div className="space-y-2 text-center">
        <LifeBuoy className="mx-auto size-8 text-brand" aria-hidden />
        <h1 className="text-2xl font-bold tracking-tight">Administrator login</h1>
      </div>
      <LoginForm />
      <Link href="/" className="text-center text-sm text-muted hover:underline">Back to the helpdesk</Link>
    </main>
  );
}
