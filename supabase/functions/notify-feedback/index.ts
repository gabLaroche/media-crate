import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

serve(async (req) => {
  const payload = await req.json();
  const record = payload.record;

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: { user }, error } = await adminClient.auth.admin.getUserById(record.user_id);

  if (error || !user) {
    console.error("Failed to fetch user:", error);
    return new Response("Failed to fetch user", { status: 500 });
  }

  const displayName = user.user_metadata?.display_name ?? "Unknown";
  const email = user.email ?? "Unknown";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "MediaCrate <notifications@mediacrate.gabriellaroche.dev>",
      to: "gabriel.laroche@protonmail.com",
      subject: `New ${record.type === "bug" ? "Bug Report" : "Feature Request"} — MediaCrate`,
      html: `
        <h2>New ${record.type === "bug" ? "Bug Report" : "Feature Request"}</h2>
        <p><strong>From:</strong> ${displayName} (${email})</p>
        <p><strong>Message:</strong></p>
        <p>${record.message}</p>
        <p><small>Submitted at ${record.created_at}</small></p>
      `,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Resend error:", err);
    return new Response("Failed to send email", { status: 500 });
  }

  return new Response("OK", { status: 200 });
});
