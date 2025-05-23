import { serve } from "https://deno.land/x/sift@0.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
async function handleSave(req) {
  const { userId, frequency, tone, phone } = await req.json();
  if (!userId || !frequency || !tone || !phone) {
    return new Response(JSON.stringify({
      error: "missing userId|frequency|tone|phone"
    }), {
      status: 400
    });
  }
  const { error } = await supabase.from("profiles").update({
    reminder_frequency: frequency,
    reminder_tone: tone,
    phone
  }).eq("id", userId);
  if (error) {
    return new Response(JSON.stringify({
      error: "Database update failed",
      detail: error.message
    }), {
      status: 500
    });
  }
  return new Response(JSON.stringify({
    success: true
  }), {
    status: 200
  });
}
serve((req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }
  return handleSave(req).then((res)=>{
    res.headers.set("Access-Control-Allow-Origin", "*");
    return res;
  });
});
