"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trackSchema, type TrackInput } from "@/lib/validation";
import type { TrackingData } from "@/types/tracking";
import { Button } from "@/components/ui/button";
import { Field, Notice, inputClass } from "@/components/ui/field";
import { TrackingResult } from "./tracking-result";

export function TrackForm() {
  const [serverError, setServerError] = useState("");
  const [result, setResult] = useState<TrackingData | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TrackInput>({ resolver: zodResolver(trackSchema) });

  async function onSubmit(values: TrackInput) {
    setServerError("");
    setResult(null);
    try {
      // POST body, never the URL: the token must not end up in history or logs.
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (data?.fieldErrors) {
          const entries = Object.entries(data.fieldErrors as Record<string, string[]>);
          for (const [field, messages] of entries) {
            setError(field as keyof TrackInput, { message: messages[0] });
          }
        }
        setServerError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }
      setResult(data as TrackingData);
    } catch {
      setServerError(
        "Could not reach the server. Please check your internet connection and try again.",
      );
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-5 rounded-xl border border-line bg-white p-5 sm:p-8"
      >
        <Field label="Ticket ID" htmlFor="ticketId" error={errors.ticketId?.message}>
          <input
            id="ticketId"
            placeholder="CH-7K3M-9PQ2"
            autoComplete="off"
            aria-invalid={!!errors.ticketId}
            className={`${inputClass} font-mono uppercase`}
            {...register("ticketId")}
          />
        </Field>
        <Field
          label="Tracking Token"
          htmlFor="token"
          error={errors.token?.message}
          hint="The long secret string you received when you submitted."
        >
          <input
            id="token"
            type="password"
            autoComplete="off"
            aria-invalid={!!errors.token}
            className={`${inputClass} font-mono`}
            {...register("token")}
          />
        </Field>
        {serverError && <Notice tone="error">{serverError}</Notice>}
        <Button type="submit" loading={isSubmitting}>
          Track complaint
        </Button>
      </form>

      {result && <TrackingResult data={result} />}
    </div>
  );
}