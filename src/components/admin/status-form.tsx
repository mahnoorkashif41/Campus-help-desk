"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { STATUSES, type StatusValue } from "@/lib/constants";
import { statusUpdateSchema, type StatusUpdateInput } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Field, Notice, inputClass } from "@/components/ui/field";

type Props = { complaintId: string; currentStatus: StatusValue };

export function StatusForm({ complaintId, currentStatus }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const options = STATUSES.filter((s) => s.value !== currentStatus);

  const { register, handleSubmit, watch, reset, setError, formState: { errors, isSubmitting } } = useForm<StatusUpdateInput>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: { status: options[0].value, note: "" },
  });
  const selected = watch("status");

  async function onSubmit(values: StatusUpdateInput) {
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/complaints/${complaintId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (data?.fieldErrors) {
          for (const [field, messages] of Object.entries(data.fieldErrors as Record<string, string[]>)) {
            setError(field as keyof StatusUpdateInput, { message: messages[0] });
          }
        }
        setMessage({ tone: "error", text: data?.error ?? "Something went wrong. Please try again." });
        return;
      }
      setMessage({ tone: "info", text: "Status updated." });
      // After this change the new current status is values.status, so default the dropdown to a different one.
      reset({ status: STATUSES.find((s) => s.value !== values.status)!.value, note: "" });
      router.refresh();
    } catch {
      setMessage({ tone: "error", text: "Could not reach the server. Please check your connection and try again." });
    }
  }

  const resolving = selected === "RESOLVED";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 rounded-xl border border-line bg-white p-5">
      <Field label="Change status to" htmlFor="status" error={errors.status?.message}>
        <select id="status" className={inputClass} {...register("status")}>
          {options.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </Field>
      <Field
        label={resolving ? "Resolution note" : "Note"}
        htmlFor="note"
        optional={!resolving}
        error={errors.note?.message}
        hint={resolving ? "Explain what was done. The student can read this." : currentStatus === "RESOLVED" ? "Reopening clears the current resolution note. It stays in the history." : undefined}
      >
        <textarea id="note" rows={4} aria-invalid={!!errors.note} className={inputClass} {...register("note")} />
      </Field>
      {message && <Notice tone={message.tone}>{message.text}</Notice>}
      <Button type="submit" loading={isSubmitting} className="w-full">Update status</Button>
    </form>
  );
}