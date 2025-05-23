import { corsHeaders } from '../_shared/cors.ts';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from 'npm:@google/generative-ai@0.11.3'; // Using a specific version
console.log("generate-toned-reminder function initializing.");
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const requestBody = await req.json();
    const { userId, tone: tone1, displayName: displayName1 } = requestBody;
    console.log(`Generating toned reminder for userId: ${userId}, tone: ${tone1}, displayName: ${displayName1 || 'N/A'}`);
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY is not set in environment variables.');
      throw new Error('GEMINI_API_KEY is not set.');
    }
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash-latest'
    });
    let prompt = `You are a hydration reminder assistant for an app called "Water-4-Weight Loss".
A user, whose display name is "${displayName1 || 'User'}", needs a concise and engaging SMS reminder to drink water.`;
    prompt += `\n\nThe desired tone for the reminder is: "${tone1}".

Please craft a reminder message with the following characteristics:
- Directly encourage drinking water.
- Be very short and suitable for an SMS message (ideally 1-2 short sentences, max 160 characters).
- Be creative and try to vary your responses if called multiple times for the same user/tone.
- Address the user by their display name if it makes sense for the tone and context.`;
    switch(tone1.toLowerCase()){
      case 'kind':
        prompt += `\n- For "Kind" tone: Be gentle, supportive, positive, and caring. Focus on well-being.`;
        break;
      case 'funny':
        prompt += `\n- For "Funny" tone: Use light-hearted humor, a witty observation, or a playful joke. Avoid complex puns. Keep it universally understandable.`;
        break;
      case 'sarcastic':
        prompt += `\n- For "Sarcastic" tone: Be dryly witty or use playful irony.`;
        break;
      case 'rude':
        prompt += `\n- For "Rude" tone: Be playfully abrasive or mock-insulting to grab attention.`;
        break;
      case 'crude':
        prompt += `\n- For "Crude" tone: Use direct, blunt, or slightly off-color humor.`;
        break;
      default:
        prompt += `\n- For an unrecognized tone, default to a friendly and encouraging message.`;
        break;
    }
    prompt += `\n\nGenerate ONLY the reminder message text itself. Do not add any preambles like "Here's your message:".`;
    console.log("Constructed prompt for Gemini:", prompt);
    const generationConfig = {
      temperature: 0.75,
      topK: 1,
      topP: 1,
      maxOutputTokens: 60
    };
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
      }
    ];
    const chat = model.startChat({
      generationConfig,
      safetySettings,
      history: []
    });
    const result = await chat.sendMessage(prompt);
    const geminiResponse = result.response;
    let tonedMessage = geminiResponse.text();
    tonedMessage = tonedMessage.replace(/^["'\s]+|["'\s]+$/g, '');
    tonedMessage = tonedMessage.replace(/^(message|reminder):\s*/i, '');
    console.log(`Gemini response for userId ${userId} (cleaned): "${tonedMessage}"`);
    if (!tonedMessage || tonedMessage.trim() === "") {
      tonedMessage = `Hey ${displayName1 || 'there'}, it's time for some water! (This is your ${tone1.toLowerCase()} reminder style)`;
      console.warn("Gemini returned an empty message or failed to generate, using fallback.");
    }
    const responseBody = {
      tonedMessage
    };
    return new Response(JSON.stringify(responseBody), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Error in generate-toned-reminder:', error.message, error.stack);
    const fallbackMessage = `Time to hydrate, ${displayName || 'friend'}! Your ${tone.toLowerCase()} reminder couldn't be created by the AI right now, but drinking water is always a smart move.`;
    return new Response(JSON.stringify({
      tonedMessage: fallbackMessage,
      error: `Failed to generate toned message: ${error.message}`
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  }
}); /*
To deploy this function:
1. Save this code as `supabase/functions/generate-toned-reminder/index.ts`.
2. Ensure you have `supabase/functions/_shared/cors.ts`. A simple one:
   // supabase/functions/_shared/cors.ts
   export const corsHeaders = {
     'Access-Control-Allow-Origin': '*', // Or your specific frontend URL for production
     'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
   };
3. Set your `GEMINI_API_KEY` in Supabase Dashboard: Project Settings -> Edge Functions -> Add new secret.
4. Deploy this new function: `supabase functions deploy generate-toned-reminder --no-verify-jwt`
5. **IMPORTANT**: Update your `trigger-scheduled-reminders` Edge Function.
   Change the line where it invokes the message generation function from:
   `supabaseAdminClient.functions.invoke('generate-personalized-message', ...)`
   TO:
   `supabaseAdminClient.functions.invoke('generate-toned-reminder', ...)`
   And ensure the response it expects is `messageData.tonedMessage` if you changed the response key.
   (The provided `trigger-scheduled-reminders` was expecting `messageData.personalizedMessage`,
    so if you use `tonedMessage` in *this* function's response, update the calling function accordingly).
*/ 
