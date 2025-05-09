/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { corsHeaders } from '../_shared/cors.ts';

console.log("generate-personalized-message function initializing");

// Constants
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'; // Example URL, verify this

// Get API Key from environment variables
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

if (!GEMINI_API_KEY) {
  console.error('Missing GEMINI_API_KEY environment variable');
  // Handle initialization failure
}

Deno.serve(async (req) => {
  console.log("generate-personalized-message function invoked");

  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request");
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, frequency, tone, userName } = await req.json();
    console.log("Received data:", { userId, frequency, tone, userName });

    if (!tone) {
      return new Response(JSON.stringify({ error: 'Missing required field: tone' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Construct the prompt for Gemini
    // TODO: Refine this prompt for better results!
    const prompt = `Generate a short, ${tone} reminder message for ${userName || 'someone'} to drink water. They want reminders ${frequency || 'regularly'}. Be creative and concise. Message only, no preamble.`;
    console.log("Generated prompt:", prompt);

    // Call Gemini API
    const geminiReqBody = {
      contents: [{
        parts: [{
          text: prompt,
        }],
      }],
      // Add safety settings, generation config if needed
    };

    const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiReqBody),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`Gemini API error: ${res.status} ${res.statusText}`, errorBody);
      throw new Error(`Gemini API request failed: ${res.statusText}`);
    }

    const geminiData = await res.json();
    console.log("Gemini API response:", geminiData);

    // Extract the message - structure might vary based on Gemini API version
    const generatedText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      console.error("Could not extract generated text from Gemini response");
      throw new Error('Failed to parse message from Gemini API response');
    }

    console.log("Generated message:", generatedText.trim());
    return new Response(JSON.stringify({ message: generatedText.trim() }), {
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