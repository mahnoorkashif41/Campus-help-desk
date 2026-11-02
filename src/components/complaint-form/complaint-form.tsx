"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BUILDINGS, CATEGORIES, CREDENTIALS_STORAGE_KEY } from "@/lib/constants";
import { complaintSchema, type ComplaintInput } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Field, Notice, inputClass } from "@/components/ui/field";
import { compressImages, ImageCompressionError } from "@/lib/compress-images";
import { ImagePicker } from "./image-picker";

export function ComplaintForm() {
  const [images, setImages] = useState<File[]>([]);
  const [imageError, setImageError] = useState("");
  const [serverError, setServerError] = useState("");
  const [phase, setPhase] = useState<"idle" | "photos" | "sending">("idle");
  const router = useRouter();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<ComplaintInput>({ resolver: zodResolver(complaintSchema), defaultValues: { website: "" } });

  async function onSubmit(values: ComplaintInput) {
    setServerError("");
    try {
      const body = new FormData();
      Object.entries(values).forEach(([key, value]) => body.append(key, value ?? ""));

      if (images.length > 0) {
        setPhase("photos");
        const compressed = await compressImages(images);
        compressed.forEach((file) => body.append("images", file));
      }

      setPhase("sending");
      const res = await fetch("/api/complaints", { method: "POST", body });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (data?.fieldErrors) {
          for (const [field, messages] of Object.entries(data.fieldErrors as Record<string, string[]>)) {
            setError(field as keyof ComplaintInput, { message: messages[0] });
          }
        }
        setServerError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }
      // Shown once on the success page, then removed from the browser.
      sessionStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify({ ticketId: data.ticketId, token: data.token }));
      router.push("/submit/success");
    } catch (error) {
      setServerError(error instanceof ImageCompressionError ? error.message : "Could not reach the server. Please check your internet connection and try again.");
    } finally {
      setPhase("idle");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6 rounded-xl border border-line bg-white p-5 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" htmlFor="studentName" error={errors.studentName?.message}>
          <input id="studentName" autoComplete="name" aria-invalid={!!errors.studentName} className={inputClass} {...register("studentName")} />
        </Field>
        <Field label="Email" htmlFor="studentEmail" error={errors.studentEmail?.message} hint="Only the administrator can see this.">
          <input id="studentEmail" type="email" autoComplete="email" aria-invalid={!!errors.studentEmail} className={inputClass} {...register("studentEmail")} />
        </Field>
        <Field label="Category" htmlFor="category" error={errors.category?.message}>
          <select id="category" defaultValue="" aria-invalid={!!errors.category} className={inputClass} {...register("category")}>
            <option value="" disabled>Choose a category</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Building" htmlFor="building" error={errors.building?.message}>
          <select id="building" defaultValue="" aria-invalid={!!errors.building} className={inputClass} {...register("building")}>
            <option value="" disabled>Choose a building</option>
            {BUILDINGS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Room number" htmlFor="roomNumber" optional error={errors.roomNumber?.message}>
          <input id="roomNumber" aria-invalid={!!errors.roomNumber} className={inputClass} {...register("roomNumber")} />
        </Field>
        <Field label="Issue title" htmlFor="title" error={errors.title?.message}>
          <input id="title" placeholder="e.g. Projector not turning on" aria-invalid={!!errors.title} className={inputClass} {...register("title")} />
        </Field>
      </div>
      <Field label="Description" htmlFor="description" error={errors.description?.message} hint="What is wrong, and since when?">
        <textarea id="description" rows={5} aria-invalid={!!errors.description} className={inputClass} {...register("description")} />
      </Field>
      <div className="space-y-1.5">
        <p className="text-sm font-medium">Photos <span className="font-normal text-muted">(optional)</span></p>
        <ImagePicker files={images} onChange={(f) => { setImages(f); setImageError(""); }} onError={setImageError} />
        {imageError && <p role="alert" className="text-xs font-medium text-red-700">{imageError}</p>}
      </div>
      {/* Honeypot: hidden from people, bots tend to fill it in */}
      <div className="absolute -left-[9999px]" aria-hidden>
        <label htmlFor="website">Website</label>
        <input id="website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>
      <p className="text-xs text-muted">Privacy: your name, email, and photos are visible only to the campus administrator. They are never shown on the tracking page.</p>
      {serverError && <Notice tone="error">{serverError}</Notice>}
      <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto">{phase === "photos" ? "Preparing photos..." : phase === "sending" ? "Submitting..." : "Submit complaint"}</Button>
    </form>
  );
}