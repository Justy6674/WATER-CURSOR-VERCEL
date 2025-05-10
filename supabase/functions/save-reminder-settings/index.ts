// supabase/functions/save-reminder-settings/index.ts
// DEBUGGING VERSION: CORS IMPORT AND USAGE TEMPORARILY REMOVED
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

console.log("save-reminder-settings function initializing (v3 - explicit OPTIONS handling).");

Deno.serve(async (req)=>{
  console.log(`save-reminder-settings (v3) received request: ${req.method} ${req.url}`);

  // Explicitly handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request for save-reminder-settings (v3).");
    return new Response('ok', { headers: corsHeaders });
  }

  // All other requests (e.g., POST) proceed here
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Supabase URL or Service Role Key is missing.");
      return new Response(JSON.stringify({
        error: "Server configuration error."
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500 
      });
    }

    const supabaseAdminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      global: { // Forcing Authorization header for admin client
        headers: { Authorization: `Bearer ${supabaseServiceRoleKey}` }
      }
    });

    if (req.method === 'POST' && !req.headers.get('content-type')?.includes('application/json')) {
      console.warn("Request for POST method does not have Content-Type: application/json");
    }

    if (!req.body) {
      console.error("Request body is null or undefined for POST request.");
      return new Response(JSON.stringify({
        error: 'Request body is missing for POST request.'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }
    
    let requestBodyData;
    try {
      requestBodyData = await req.json();
    } catch (e) {
      console.error("Error parsing request body as JSON:", e.message);
      return new Response(JSON.stringify({
        error: 'Invalid JSON in request body.'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const { userId, frequency, tone, phoneNumber } = requestBodyData;

    if (!userId || !frequency || !tone || !phoneNumber) {
      console.warn("Missing required fields in request:", { userId, frequency, tone, phoneNumber });
      return new Response(JSON.stringify({
        error: 'Missing required fields: userId, frequency, tone, phoneNumber are all required.'
      }), {
        headers: { 'Content-Type': 'application/json' }, 
        status: 400 
      });
    }

    if (!/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
      console.warn("Invalid phone number format:", phoneNumber);
      return new Response(JSON.stringify({
        error: 'Invalid phone number format. Please use E.164 format (e.g., +61400000000).'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    console.log(`Attempting to save/update settings for userId: ${userId}`);
    console.log(`Payload: Frequency: ${frequency}, Tone: ${tone}, Phone: ${phoneNumber}`);

    const { data, error } = await supabaseAdminClient
      .from('profiles')
      .upsert({
        user_id: userId,
        reminder_frequency: frequency,
        reminder_tone: tone,
        phone_number: phoneNumber,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving reminder settings to profiles table:', error.message, JSON.stringify(error));
      throw error;
    }

    console.log('Successfully saved/updated reminder settings for user:', userId, data);
    return new Response(JSON.stringify({
      success: true,
      message: 'Settings saved successfully.',
      data
    }), {
      headers: { 'Content-Type': 'application/json' }, 
      status: 200
    });

  } catch (error) {
    console.error('Error in save-reminder-settings function (POST path):', error.message, JSON.stringify(error));
    return new Response(JSON.stringify({
      error: error.message || "Failed to save settings due to an unexpected error."
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}); 