// @verify_jwt false 
// (Keep this comment if you intend to deploy with --no-verify-jwt, 
//  otherwise, remove it and deploy without the --no-verify-jwt flag if you want Supabase to verify user JWTs)
import { serve } from "https://deno.land/x/sift@0.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// --- Environment Variable Retrieval and Validation ---
// These names MUST match the names of the secrets you've set in your Supabase Project Dashboard
const SUPABASE_URL_FROM_ENV = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY_FROM_ENV = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_FROM_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");
// Log to check if variables are loaded (these logs will appear in your Supabase Function logs)
console.log("--- Environment Variable Check ---");
console.log("SUPABASE_URL:", SUPABASE_URL_FROM_ENV ? "Found" : "NOT FOUND!");
console.log("SUPABASE_SERVICE_ROLE_KEY:", SUPABASE_SERVICE_ROLE_KEY_FROM_ENV ? "Found" : "NOT FOUND!");
console.log("GEMINI_API_KEY:", GEMINI_API_KEY ? "Found" : "NOT FOUND!");
console.log("TWILIO_ACCOUNT_SID:", TWILIO_ACCOUNT_SID ? "Found" : "NOT FOUND!");
console.log("TWILIO_AUTH_TOKEN:", TWILIO_AUTH_TOKEN ? "Found" : "NOT FOUND!");
console.log("TWILIO_FROM_NUMBER:", TWILIO_FROM_NUMBER ? "Found" : "NOT FOUND!");
console.log("--- End Environment Variable Check ---");
// --- Supabase Client Initialization ---
// Check if essential Supabase variables are present before creating the client
if (!SUPABASE_URL_FROM_ENV) {
  console.error("CRITICAL ERROR: SUPABASE_URL environment variable not found or is empty.");
// Deno.exit(1); // Or handle by returning an error response immediately if used within serve
}
if (!SUPABASE_SERVICE_ROLE_KEY_FROM_ENV) {
  console.error("CRITICAL ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable not found or is empty.");
// Deno.exit(1); // Or handle
}
// This line might still cause an issue if the variables are truly empty,
// as createClient expects non-empty strings. The checks above are crucial.
const supabase = createClient(SUPABASE_URL_FROM_ENV, SUPABASE_SERVICE_ROLE_KEY_FROM_ENV); // Added '!' assuming checks pass
serve(async (req)=>{
  // --- Pre-flight CORS Request Handling ---
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, Apikey, x-client-info"
      }
    });
  }
  // --- Early Exit if Supabase Client Failed to Initialize (due to missing env vars) ---
  // This check is now more robust because we log before this point
  if (!SUPABASE_URL_FROM_ENV || !SUPABASE_SERVICE_ROLE_KEY_FROM_ENV) {
    console.error("Aborting request: Supabase environment variables were not loaded correctly.");
    return new Response(JSON.stringify({
      error: "Internal Server Configuration Error. Essential services unavailable."
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
  // --- Request Body Processing ---
  let userId, tone, phone;
  try {
    const body = await req.json();
    userId = body.userId;
    tone = body.tone;
    phone = body.phone;
  } catch (e) {
    console.error("Failed to parse request body:", e.message);
    return new Response(JSON.stringify({
      error: "Invalid request body. Expected JSON."
    }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
  if (!userId || !tone || !phone) {
    console.warn("Missing fields in request:", {
      userId,
      tone,
      phone
    });
    return new Response(JSON.stringify({
      error: "Missing required fields: userId, tone, and phone are required."
    }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
  // --- Profile Lookup ---
  const { data: profile, error: profileError } = await supabase.from("profiles").select("id, full_name").eq("id", userId).single();
  if (profileError || !profile) {
    console.error("Profile lookup failed:", profileError?.message || "Profile not found.");
    return new Response(JSON.stringify({
      error: `Profile lookup failed: ${profileError?.message || "User not found."}`
    }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
  // --- Gemini API Call ---
  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not configured.");
    return new Response(JSON.stringify({
      error: "AI service is not configured."
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
  let message = `Hey ${profile.full_name}, don’t forget to drink some water!`; // Default message
  try {
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Write a ${tone} hydration reminder for ${profile.full_name}`
              }
            ]
          }
        ]
      })
    });
    if (!geminiRes.ok) {
      const errorBody = await geminiRes.text();
      console.error(`Gemini API request failed with status ${geminiRes.status}:`, errorBody);
    // Keep default message if Gemini fails
    } else {
      const geminiJson = await geminiRes.json();
      const generatedText = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (generatedText) {
        message = generatedText;
      } else {
        console.warn("Gemini response was successful but did not contain expected text structure. Using default message.");
      }
    }
  } catch (e) {
    console.error("Error calling Gemini API:", e.message);
  // Keep default message if Gemini call throws an exception
  }
  // --- Twilio API Call ---
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    console.error("Twilio credentials are not fully configured.");
    return new Response(JSON.stringify({
      error: "SMS service is not configured."
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
  try {
    const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)
      },
      body: new URLSearchParams({
        From: TWILIO_FROM_NUMBER,
        To: phone,
        Body: message
      })
    });
    if (!twilioRes.ok) {
      const errorBody = await twilioRes.text(); // Get more details from Twilio error
      console.error(`Twilio API request failed with status ${twilioRes.status}:`, errorBody);
      return new Response(JSON.stringify({
        error: "Twilio send failed. Could not send SMS.",
        details: errorBody
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    const twilioJson = await twilioRes.json();
    console.log("Twilio success response:", twilioJson.sid);
  } catch (e) {
    console.error("Error calling Twilio API:", e.message);
    return new Response(JSON.stringify({
      error: "SMS service encountered an unexpected error."
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
  // --- Success Response ---
  return new Response(JSON.stringify({
    message: `Message sent: ${message}`
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
});
