import Link from "next/link";
import { Camera, KeyRound, ShieldCheck } from "lucide-react";
import { linkButtonClass } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/constants";

const points = [
  { icon: ShieldCheck, title: "No account needed", text: "Report a problem without registering or logging in." },
  { icon: Camera, title: "Add up to 3 photos", text: "Pictures are stored privately. Only you and the administrator can view them." },
  { icon: KeyRound, title: "Track with two keys", text: "You get a Ticket ID and a secret Tracking Token. You need both to check progress." },
];

export default function HomePage() {
  return (
    <div className="space-y-14">
      <section className="grid items-center gap-10 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-5">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">Broken projector? Dead Wi-Fi? Tell us, and follow it to the fix.</h1>
          <p className="max-w-prose text-lg text-muted">Report equipment problems anywhere on campus. You will get a ticket you can use to see when it is picked up and when it is resolved.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/submit" className={linkButtonClass("primary")}>Report an issue</Link>
            <Link href="/track" className={linkButtonClass("secondary")}>Track a complaint</Link>
          </div>
        </div>
        {/* Decorative ticket showing the FORMAT only (no real data) */}
        <div aria-hidden className="mx-auto w-full max-w-xs -rotate-2 rounded-2xl border border-line bg-white shadow-lg">
          <div className="space-y-1 p-5">
            <p className="text-xs font-medium text-muted">Ticket ID format</p>
            <p className="font-mono text-2xl font-bold tracking-wider">CH-XXXX-XXXX</p>
          </div>
          <div className="relative border-t-2 border-dashed border-line p-5">
            <span className="absolute -left-3 -top-3 size-6 rounded-full bg-paper" />
            <span className="absolute -right-3 -top-3 size-6 rounded-full bg-paper" />
            <p className="text-xs font-medium text-muted">Tracking Token</p>
            <p className="break-all font-mono text-sm text-muted">a long secret string shown once</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="how" className="grid gap-4 sm:grid-cols-3">
        <h2 id="how" className="sr-only">How it works</h2>
        {points.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-xl border border-line bg-white p-5">
            <Icon className="mb-3 size-6 text-brand" aria-hidden />
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted">{text}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="cats" className="space-y-3">
        <h2 id="cats" className="text-lg font-semibold">What you can report</h2>
        <ul className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => <li key={c.value} className="rounded-full border border-line bg-white px-4 py-1.5 text-sm">{c.label}</li>)}
        </ul>
      </section>
    </div>
  );
}
