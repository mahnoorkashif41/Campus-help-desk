import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// SERVER ONLY. This file uses the service-role key, which can do anything in your Supabase project.
// Never import it from a component marked "use client", and never give the key a NEXT_PUBLIC_ name.
let client: SupabaseClient | undefined;

function getClient(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to use image storage.");
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return client;
}

function bucket() {
  return getClient().storage.from(process.env.SUPABASE_STORAGE_BUCKET || "complaint-images");
}

export async function uploadImage(path: string, bytes: Buffer, contentType: string): Promise<void> {
  const { error } = await bucket().upload(path, bytes, { contentType, upsert: false, cacheControl: "3600" });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
}

export async function removeImages(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await bucket().remove(paths);
  if (error) throw new Error(`Storage remove failed: ${error.message}`);
}

/** Short-lived links to private files. Only call this after the viewer is verified (admin or ticket owner). */
export async function createSignedUrls(paths: string[], expiresInSeconds: number): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (paths.length === 0) return result;
  const { data, error } = await bucket().createSignedUrls(paths, expiresInSeconds);
  if (error) throw new Error(`Could not create signed URLs: ${error.message}`);
  for (const item of data) {
    if (item.path && item.signedUrl && !item.error) result.set(item.path, item.signedUrl);
  }
  return result;
}