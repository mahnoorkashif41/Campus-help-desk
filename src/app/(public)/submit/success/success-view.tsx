"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CredentialsCard } from "@/components/tracking/credentials-card";
import { linkButtonClass } from "@/components/ui/button";
import { CREDENTIALS_STORAGE_KEY } from "@/lib/constants";

type Credentials = { ticketId: string; token: string };

export function SuccessView() {
  const [creds, setCreds] = useState<Credentials | null>(null);
  const [checked, setChecked] = useState(false);

  // Read after the page loads (sessionStorage does not exist on the server), then delete it.
  // The token is therefore shown only once: refreshing this page will not show it again.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CREDENTIALS_STORAGE_KEY);
      if (raw) {
        setCreds(JSON.parse(raw));
        sessionStorage.removeItem(CREDENTIALS_STORAGE_KEY);
      }
    } catch {
      /* storage unavailable: fall through to the empty state */
    }
    setChecked(true);
  }, []);

  if (!checked) return <p className="text-muted">Loading...</p>;
  if (!creds) {
    return (
      <div className="space-y-4 rounded-xl border border-dashed border-line bg-white p-6">
        <p className="text-muted">There are no ticket details to show. Your Ticket ID and token are displayed only once, right after you submit. If you just submitted and refreshed this page, the token cannot be shown again.</p>
        <Link href="/submit" className={linkButtonClass("secondary")}>Report an issue</Link>
      </div>
    );
  }
  return <CredentialsCard ticketId={creds.ticketId} token={creds.token} />;
}
