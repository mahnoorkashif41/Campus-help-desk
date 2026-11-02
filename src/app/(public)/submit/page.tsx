import type { Metadata } from "next";
import { ComplaintForm } from "@/components/complaint-form/complaint-form";

export const metadata: Metadata = { title: "Report an issue" };

export default function SubmitPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Report an issue</h1>
        <p className="text-muted">No login needed. When you submit, you receive a Ticket ID and a Tracking Token.</p>
      </div>
      <ComplaintForm />
    </div>
  );
}
