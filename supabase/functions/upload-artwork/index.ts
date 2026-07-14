import { createClient } from "npm:@supabase/supabase-js@2";

// Magic byte signatures for supported image types
const MIME_SIGNATURES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46], // "RIFF" — bytes 8-11 must also be "WEBP"
};

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function detectMime(header: Uint8Array): string | null {
  for (const [mime, sig] of Object.entries(MIME_SIGNATURES)) {
    if (!sig.every((b, i) => header[i] === b)) continue;
    if (mime === "image/webp") {
      // Bytes 8-11 must spell "WEBP"
      const webp = [0x57, 0x45, 0x42, 0x50];
      if (!webp.every((b, i) => header[8 + i] === b)) continue;
    }
    return mime;
  }
  return null;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  // Verify user via their JWT directly against GoTrue - supabase-js's
  // auth.getUser() with no argument reads a persisted session from client
  // storage, which doesn't exist in a stateless edge function, and always
  // fails with "Auth session missing!" regardless of the bearer token.
  const authRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, {
    headers: {
      Authorization: authHeader,
      apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
    },
  });
  if (!authRes.ok) return json({ error: "Unauthorized" }, 401);
  const user = await authRes.json();

  // Admin client bypasses RLS for storage and DB writes
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }

  const file = formData.get("file") as File | null;
  const hash = formData.get("hash") as string | null;
  if (!file) return json({ error: "No file provided" }, 400);

  // Server-side file type validation via magic bytes
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const mime = detectMime(header);
  if (!mime) return json({ error: "Only JPEG, PNG, and WebP images are supported." }, 400);

  // Hash deduplication: return existing artwork without re-uploading
  if (hash) {
    const { data: existing } = await admin
      .from("artworks")
      .select("id, url")
      .eq("hash", hash)
      .maybeSingle();
    if (existing) return json({ url: existing.url, id: existing.id });
  }

  // Server-side quota check
  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("used_bytes, upload_quota_mb")
    .eq("id", user.id)
    .single();
  if (profileErr) return json({ error: "Failed to check quota." }, 500);

  const quotaBytes = (profile.upload_quota_mb ?? 50) * 1024 * 1024;
  if (profile.used_bytes + file.size > quotaBytes) {
    const usedMb = (profile.used_bytes / 1024 / 1024).toFixed(1);
    return json({
      error: `Storage quota exceeded (${usedMb} MB used of ${profile.upload_quota_mb ?? 50} MB).`,
    }, 400);
  }

  // Upload to Storage under the user's own folder
  const filePath = `${user.id}/${crypto.randomUUID()}.${EXT_MAP[mime]}`;
  const { error: uploadErr } = await admin.storage
    .from("artworks")
    .upload(filePath, file, { contentType: mime });
  if (uploadErr) return json({ error: "Upload failed." }, 500);

  const { data: { publicUrl } } = admin.storage.from("artworks").getPublicUrl(filePath);

  // Insert artwork row — DB trigger auto-increments profiles.used_bytes
  const { data: artwork, error: artworkErr } = await admin
    .from("artworks")
    .insert({
      file_path: filePath,
      url: publicUrl,
      size_bytes: file.size,
      hash: hash ?? null,
      owner_user_id: user.id,
    })
    .select("id, url")
    .single();

  if (artworkErr) {
    await admin.storage.from("artworks").remove([filePath]);
    return json({ error: "Failed to save artwork." }, 500);
  }

  return json({ url: artwork.url, id: artwork.id });
});
