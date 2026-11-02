import type { Metadata } from "next";
import { TrackForm } from "@/components/tracking/track-form";

export const metadata: Metadata = { title: "Track a complaint" };

export default function TrackPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Track a complaint</h1>
        <p className="text-muted">Enter both your Ticket ID and Tracking Token to see the current status.</p>
      </div>
      <TrackForm />
    </div>
  );
}
