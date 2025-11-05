import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface VerificationRequest {
  phoneNumber: string;
  action: "send" | "verify";
  code?: string;
  verificationId?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { phoneNumber, action, code, verificationId }: VerificationRequest = await req.json();

    if (action === "send") {
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      const { data: verification, error: insertError } = await supabase
        .from("sms_verifications")
        .insert({
          user_id: user.id,
          phone_number: phoneNumber,
          code: verificationCode,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return new Response(
        JSON.stringify({
          success: true,
          verificationId: verification.id,
          code: verificationCode,
          message: "Code de v\u00e9rification g\u00e9n\u00e9r\u00e9",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else if (action === "verify") {
      if (!verificationId || !code) {
        throw new Error("Missing verificationId or code");
      }

      const { data: verification, error: fetchError } = await supabase
        .from("sms_verifications")
        .select("*")
        .eq("id", verificationId)
        .maybeSingle();

      if (fetchError || !verification) {
        throw new Error("Code de v\u00e9rification introuvable");
      }

      if (new Date(verification.expires_at) < new Date()) {
        throw new Error("Code expir\u00e9");
      }

      if (verification.attempts >= 5) {
        throw new Error("Trop de tentatives");
      }

      if (verification.code !== code) {
        await supabase
          .from("sms_verifications")
          .update({ attempts: verification.attempts + 1 })
          .eq("id", verificationId);
        throw new Error("Code incorrect");
      }

      await supabase
        .from("sms_verifications")
        .update({ verified: true })
        .eq("id", verificationId);

      await supabase
        .from("users")
        .update({
          phone_number: verification.phone_number,
          phone_verified: true,
          phone_verified_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Num\u00e9ro v\u00e9rifi\u00e9 avec succ\u00e8s",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      throw new Error("Invalid action");
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Une erreur est survenue",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});