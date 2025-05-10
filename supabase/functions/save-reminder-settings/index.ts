// supabase/functions/save-reminder-settings/index.ts
// DEBUGGING VERSION: CORS IMPORT AND USAGE TEMPORARILY REMOVED
import { createClient } from 'npm:@supabase/supabase-js@2';

console.log("save-reminder-settings function initializing (DEBUG - NO CORS).");

Deno.serve(async (req)=>{
  // const requestOrigin = req.headers.get('Origin') || undefined; // CORS related
  console.log(`save-reminder-settings (DEBUG) received request: ${req.method} ${req.url}`);

  // CORS OPTIONS request handling removed for this test
  // if (req.method === 'OPTIONS') {
  //   console.log("Handling OPTIONS request for save-reminder-settings.");
  //   return new Response('ok', { headers: { /* Basic headers if needed, or let it be handled by gateway */ } });
  // }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Supabase URL or Service Role Key is missing.");
      return new Response(JSON.stringify({
        error: "Server configuration error."
      }), {
        headers: { 'Content-Type': 'application/json' }, // CORS headers removed
        status: 500 
      });
    }

    const supabaseAdminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      global: { // Forcing Authorization header for admin client
        headers: { Authorization: `Bearer ${supabaseServiceRoleKey}` }
      }
    });

    // For non-OPTIONS requests that are not GET, Supabase might require a Content-Type header
    // For cron jobs or direct invocations, this might not be an issue.
    // If it's a POST from frontend, the frontend should send Content-Type: application/json
    if (req.method === 'POST' && !req.headers.get('content-type')?.includes('application/json')) {
      console.warn("Request for POST method does not have Content-Type: application/json");
      // Depending on strictness, you might return an error or proceed
    }

    // Check if the request body is actually present before trying to parse it
    if (!req.body) {
      console.error("Request body is null or undefined.");
      return new Response(JSON.stringify({
        error: 'Request body is missing.'
      }), {
        headers: { 'Content-Type': 'application/json' }, // CORS headers removed
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
        headers: { 'Content-Type': 'application/json' }, // CORS headers removed
        status: 400
      });
    }

    const { userId, frequency, tone, phoneNumber } = requestBodyData;

    if (!userId || !frequency || !tone || !phoneNumber) {
      console.warn("Missing required fields in request:", { userId, frequency, tone, phoneNumber });
      return new Response(JSON.stringify({
        error: 'Missing required fields: userId, frequency, tone, phoneNumber are all required.'
      }), {
        headers: { 'Content-Type': 'application/json' }, // CORS headers removed
        status: 400 
      });
    }

    if (!/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
      console.warn("Invalid phone number format:", phoneNumber);
      return new Response(JSON.stringify({
        error: 'Invalid phone number format. Please use E.164 format (e.g., +61400000000).'
      }), {
        headers: { 'Content-Type': 'application/json' }, // CORS headers removed
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
      throw error; // Let the catch block handle it
    }

    console.log('Successfully saved/updated reminder settings for user:', userId, data);
    return new Response(JSON.stringify({
      success: true,
      message: 'Settings saved successfully.',
      data
    }), {
      headers: { 'Content-Type': 'application/json' }, // CORS headers removed
      status: 200
    });

  } catch (error) {
    console.error('Error in save-reminder-settings function:', error.message, JSON.stringify(error));
    return new Response(JSON.stringify({
      error: error.message || "Failed to save settings due to an unexpected error."
    }), {
      headers: { 'Content-Type': 'application/json' }, // CORS headers removed
      status: 500
    });
  }
}); 