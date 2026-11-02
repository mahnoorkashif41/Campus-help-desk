import { cn } from "@/lib/utils";

export const inputClass =
  "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:border-brand disabled:opacity-60 aria-[invalid=true]:border-red-500";

type FieldProps = { label: string; htmlFor: string; error?: string; hint?: string; optional?: boolean; className?: string; children: React.ReactNode };

export function Field({ label, htmlFor, error, hint, optional, className, children }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label} {optional && <span className="font-normal text-muted">(optional)</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p role="alert" className="text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "error"; children: React.ReactNode }) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-lg border px-4 py-3 text-sm", tone === "error" ? "border-red-300 bg-red-50 text-red-900" : "border-brand/30 bg-brand-soft text-ink")}>
      {children}
    </div>
  );
}
