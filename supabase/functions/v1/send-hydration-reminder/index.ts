/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { corsHeaders } from '../_shared/cors.ts';
// Import Twilio - Note: Deno might need specific import patterns or libraries compatible with edge runtime
// Using the standard Node library here - verify compatibility or use fetch-based approach if needed.
import twilio from 'npm:twilio';

console.log("send-hydration-reminder function initializing");

// Get Twilio credentials from environment variables
const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.error('Missing Twilio environment variables');
  // Handle initialization failure
}

// Initialize Twilio client
const client = twilio(accountSid, authToken);

Deno.serve(async (req) => {
  console.log("send-hydration-reminder function invoked");

  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request");
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, phoneNumber, message } = await req.json();
    console.log("Received data:", { userId, phoneNumber, message });

    if (!phoneNumber || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields: phoneNumber, message' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Basic phone number validation (optional, add more robust validation if needed)
    if (!phoneNumber.startsWith('+')) {
        return new Response(JSON.stringify({ error: 'Invalid phone number format. Must start with +country code.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }

    console.log(`Sending SMS via Twilio to ${phoneNumber}`);

    // Send SMS using Twilio client
    const messageResponse = await client.messages.create({
      body: message,
      from: twilioPhoneNumber!,
      to: phoneNumber,
    });

    console.log('Twilio message sent:', messageResponse.sid);

    return new Response(JSON.stringify({ sid: messageResponse.sid }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error("Error processing request:", err);
    // You might want to parse Twilio-specific errors here for better reporting
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 