import type { Metadata } from "next";
import { SuccessView } from "./success-view";

export const metadata: Metadata = { title: "Complaint submitted" };

export default function SuccessPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Complaint submitted</h1>
      <SuccessView />
    </div>
  );
}
