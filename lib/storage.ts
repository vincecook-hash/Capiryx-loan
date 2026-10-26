import { createClient } from "@supabase/supabase-js";

// Server-only. The service key must never be exposed to the browser.
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const bucket = process.env.SUPABASE_BUCKET || "id-documents";

export const ALLOWED = ["image/jpeg", "image/png", "application/pdf"];
export const MAX_BYTES = 4 * 1024 * 1024;

export function looksValid(b: Buffer, type: string) {
  if (type === "image/jpeg") return b[0] === 0xff && b[1] === 0xd8;
  if (type === "image/png") return b.subarray(0, 4).toString("hex") === "89504e47";
  if (type === "application/pdf") return b.subarray(0, 4).toString() === "%PDF";
  return false;
}
export async function saveId(key: string, buf: Buffer, type: string) {
  const { error } = await sb.storage.from(bucket).upload(key, buf, { contentType: type, upsert: false });
  if (error) throw error;
}
export async function viewUrl(key: string) {
  const { data, error } = await sb.storage.from(bucket).createSignedUrl(key, 60);
  if (error || !data) throw error ?? new Error("no url");
  return data.signedUrl;
}
