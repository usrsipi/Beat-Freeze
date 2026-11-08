import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "onboarding@resend.dev";
const TO_EMAIL = "usrsipi@gmail.com";

interface GenreSuggestion {
  genreName: string;
  description?: string;
  exampleUrl: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: GenreSuggestion = await req.json();

    if (!body.genreName?.trim()) {
      return new Response(
        JSON.stringify({ error: "Genre name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!body.exampleUrl?.trim()) {
      return new Response(
        JSON.stringify({ error: "Example URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store the suggestion in the database for record-keeping
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase.from("genre_suggestions").insert({
        genre_name: body.genreName.trim(),
        description: body.description?.trim() || null,
        example_url: body.exampleUrl.trim(),
      });
    }

    // Send email via Resend if API key is configured
    if (RESEND_API_KEY) {
      const emailHtml = `
        <div style="font-family: monospace; background: #08101e; color: #e0f2fe; padding: 24px; border-radius: 12px; border: 1px solid #00f5ff40;">
          <h1 style="color: #00f5ff; font-size: 22px; text-transform: uppercase;">New Genre Suggestion — BEAT FREEZE</h1>
          <hr style="border-color: #00f5ff30; margin: 16px 0;" />
          <p><strong style="color: #00f5ff;">Genre Name:</strong> ${escapeHtml(body.genreName)}</p>
          <p><strong style="color: #00f5ff;">Description:</strong> ${escapeHtml(body.description || "No description provided")}</p>
          <p><strong style="color: #00f5ff;">Example URL:</strong> <a href="${escapeHtml(body.exampleUrl)}" style="color: #38bdf8;">${escapeHtml(body.exampleUrl)}</a></p>
          <hr style="border-color: #00f5ff30; margin: 16px 0;" />
          <p style="color: #64748b; font-size: 12px;">This suggestion was submitted from the BEAT FREEZE app.</p>
        </div>
      `;

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [TO_EMAIL],
          subject: `New Genre Suggestion: ${body.genreName}`,
          html: emailHtml,
        }),
      });

      if (!emailResponse.ok) {
        const errText = await emailResponse.text();
        console.error("Resend API error:", errText);
        // Still return success since we stored in DB
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Genre suggestion submitted successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
