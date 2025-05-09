/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors.ts';

console.log("save-reminder-settings function initializing");

// Initialize Supabase client - environment variables should be set in Supabase project settings
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY'); // Use anon key for row-level security
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'); // Use service role for direct table access if needed

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables');
  // Consider throwing an error or handling initialization failure
}

// Note: Decide whether to use anon key (respects RLS) or service role key (bypasses RLS)
// Using Service Role Key here for simplicity assuming direct profile update permission
const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceRoleKey!);

Deno.serve(async (req) => {
  console.log("save-reminder-settings function invoked");

  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request");
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extract data from request body
    const { userId, frequency, tone, phoneNumber } = await req.json();
    console.log("Received data:", { userId, frequency, tone, phoneNumber });

    if (!userId || !frequency || !tone || !phoneNumber) {
      console.error("Missing required fields");
      return new Response(JSON.stringify({ error: 'Missing required fields: userId, frequency, tone, phoneNumber are required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Upsert data into the profiles table (adjust table/column names if different)
    // Assumes a 'profiles' table with 'user_id' as primary key or unique constraint
    // and columns 'reminder_frequency', 'reminder_tone', 'phone_number'
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          user_id: userId, // Ensure this matches the primary key column name
          reminder_frequency: frequency,
          reminder_tone: tone,
          phone_number: phoneNumber,
          // reminders_enabled: true, // Optionally set reminders_enabled here if needed
          updated_at: new Date().toISOString(), // Good practice to track updates
        },
        {
          onConflict: 'user_id', // Specify the conflict target column
        }
      )
      .select() // Select the updated/inserted row to confirm
      .single(); // Expect a single row back

    if (error) {
      console.error('Supabase upsert error:', error);
      throw error; // Let the catch block handle it
    }

    console.log("Settings saved successfully for user:", userId, data);
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error("Error processing request:", err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 