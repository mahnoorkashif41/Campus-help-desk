"use client";

import { useEffect, useMemo, useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGES, MAX_ORIGINAL_IMAGE_BYTES } from "@/lib/constants";

type Props = { files: File[]; onChange: (files: File[]) => void; onError: (message: string) => void };

export function ImagePicker({ files, onChange, onError }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    const accepted: File[] = [];
    for (const f of picked) {
      if (files.length + accepted.length >= MAX_IMAGES) return onError(`You can attach at most ${MAX_IMAGES} photos.`), onChange([...files, ...accepted]);
      if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(f.type)) { onError(`"${f.name}" is not allowed. Use JPEG, PNG, or WebP images.`); continue; }
      if (f.size > MAX_ORIGINAL_IMAGE_BYTES) { onError(`"${f.name}" is larger than 5 MB. Please choose a smaller photo.`); continue; }
      accepted.push(f);
    }
    onChange([...files, ...accepted]);
  }

  return (
    <div className="space-y-3">
      <ul className="grid grid-cols-3 gap-3">
        {previews.map((src, i) => (
          <li key={src} className="relative aspect-square overflow-hidden rounded-lg border border-line bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Selected photo ${i + 1}`} className="size-full object-cover" />
            <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => onChange(files.filter((_, j) => j !== i))} className="absolute right-1 top-1 rounded-full bg-ink/80 p-1.5 text-white hover:bg-ink">
              <X className="size-3.5" aria-hidden />
            </button>
          </li>
        ))}
        {files.length < MAX_IMAGES && (
          <li>
            <button type="button" onClick={() => inputRef.current?.click()} className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-line bg-white text-xs text-muted hover:border-brand hover:text-ink">
              <ImagePlus className="size-6" aria-hidden /> Add photo
            </button>
          </li>
        )}
      </ul>
      <input ref={inputRef} type="file" accept={ALLOWED_IMAGE_TYPES.join(",")} multiple className="sr-only" onChange={handleSelect} tabIndex={-1} aria-label="Choose photos" />
      <p className="text-xs text-muted">Up to 3 photos. JPEG, PNG, or WebP, each up to 5 MB. Photos are shrunk on your device before upload, which also removes hidden location data.</p>
    </div>
  );
}
