import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const name = process.env.SUPABASE_BUCKET || "id-documents";
const { error } = await sb.storage.createBucket(name, {
  public: false,
  fileSizeLimit: 4 * 1024 * 1024,
  allowedMimeTypes: ["image/jpeg", "image/png", "application/pdf"],
});
console.log(error ? "Result: " + error.message : "Bucket created: " + name);
const l = await sb.storage.listBuckets();
console.log("Buckets in this project:", (l.data || []).map(b => b.name).join(", ") || "(none)");
