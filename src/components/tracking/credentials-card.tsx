"use client";

import { useState } from "react";
import { Check, Copy, Download, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked: user can still select the text */ }
  }
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 break-all rounded-lg bg-paper px-3 py-2 font-mono text-sm">{value}</code>
        <Button type="button" variant="secondary" onClick={copy} aria-label={`Copy ${label}`}>{copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}</Button>
      </div>
    </div>
  );
}

export function CredentialsCard({ ticketId, token }: { ticketId: string; token: string }) {
  function download() {
    const blob = new Blob([`Campus Helpdesk\nTicket ID: ${ticketId}\nTracking Token: ${token}\n`], { type: "text/plain" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `${ticketId}.txt` });
    a.click();
    URL.revokeObjectURL(a.href);
  }
  return (
    <div className="space-y-5 rounded-xl border border-line bg-white p-5 sm:p-8">
      <CopyRow label="Ticket ID" value={ticketId} />
      <CopyRow label="Tracking Token" value={token} />
      <div role="alert" className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
        <p>Save these now. The token is shown only once and cannot be recovered. Without both, you cannot track this complaint.</p>
      </div>
      <Button type="button" variant="secondary" onClick={download}><Download className="size-4" aria-hidden /> Download as text file</Button>
    </div>
  );
}
