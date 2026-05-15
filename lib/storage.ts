import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client using the service-role secret. NEVER expose
 * this to the browser — it bypasses RLS and can read every bucket.
 *
 * Used by:
 *  - `/api/admin/guests/[id]/documents` upload endpoint
 *  - `lib/guest-documents-actions.ts` for delete + signed-URL minting
 */
let cached: SupabaseClient | null = null;

export function getStorageAdmin(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL or SUPABASE_SECRET_KEY missing — cannot init Storage client",
    );
  }
  cached = createClient(url, key, {
    auth: { persistSession: false },
  });
  return cached;
}

/**
 * Private bucket for guest ID scans. Must be created in the Supabase
 * Dashboard (Storage → New bucket → private) before first upload. The
 * bootstrap step is also documented in CLAUDE.md.
 */
export const GUEST_DOCS_BUCKET = "guest-docs";

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

export async function uploadGuestDocument(args: {
  guestId: string;
  filename: string;
  contentType: string;
  body: Buffer | Blob | ArrayBuffer;
}): Promise<{ storageKey: string }> {
  const sanitized = args.filename.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const key = `${args.guestId}/${Date.now()}-${sanitized}`;
  const supabase = getStorageAdmin();
  const { error } = await supabase.storage
    .from(GUEST_DOCS_BUCKET)
    .upload(key, args.body, {
      contentType: args.contentType,
      upsert: false,
    });
  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }
  return { storageKey: key };
}

export async function signGuestDocumentUrl(
  storageKey: string,
): Promise<string> {
  const supabase = getStorageAdmin();
  const { data, error } = await supabase.storage
    .from(GUEST_DOCS_BUCKET)
    .createSignedUrl(storageKey, SIGNED_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) {
    throw new Error(`Signed URL failed: ${error?.message ?? "unknown"}`);
  }
  return data.signedUrl;
}

export async function deleteGuestDocumentObject(storageKey: string) {
  const supabase = getStorageAdmin();
  const { error } = await supabase.storage
    .from(GUEST_DOCS_BUCKET)
    .remove([storageKey]);
  if (error) {
    throw new Error(`Storage delete failed: ${error.message}`);
  }
}
