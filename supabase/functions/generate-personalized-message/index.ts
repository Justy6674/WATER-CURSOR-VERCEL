
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function generatePersonalizedMessage(userName: string, milestoneType: string) {
  console.log("Edge function called with:", { userName, milestoneType });
  
  // First try with Gemini if API key exists
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  
  if (!apiKey) {
    console.log('No Gemini API key found, using fallback message');
    return getFallbackMessage(userName, milestoneType);
  }

  try {
    console.log("Calling Gemini API...");
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{
            text: `Generate a motivational, friendly hydration reminder for ${userName} who has reached the ${milestoneType} milestone of their daily water intake. Keep it concise, encouraging, and under 100 characters.`
          }]
        }]
      })
    });

    const data = await response.json();
    console.log("Gemini API response:", data);
    
    const message = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return message || getFallbackMessage(userName, milestoneType);
  } catch (error) {
    console.error('Error generating personalized message:', error);
    return getFallbackMessage(userName, milestoneType);
  }
}

function getFallbackMessage(name: string, milestone: string): string {
  console.log("Using fallback message for:", { name, milestone });
  
  if (milestone.includes('25%')) {
    return `${name}, you're 25% of the way to your hydration goal! Keep it up!`;
  } else if (milestone.includes('50%')) {
    return `${name}, halfway there! You've reached 50% of your daily water goal.`;
  } else if (milestone.includes('75%')) {
    return `${name}, you're 75% done! Almost at your daily hydration goal!`;
  } else if (milestone.includes('100%') || milestone.includes('goal completion')) {
    return `Great job ${name}! You've completed your daily hydration goal!`;
  } else {
    return `${name}, remember to stay hydrated throughout your day!`;
  }
}

serve(async (req) => {
  console.log("Edge function request received:", req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Parsing request body");
    const { userName, milestoneType } = await req.json();
    console.log("Request parameters:", { userName, milestoneType });
    
    const personalizedMessage = await generatePersonalizedMessage(userName, milestoneType);
    console.log("Generated personalized message:", personalizedMessage);
    
    return new Response(JSON.stringify({ 
      personalizedMessage: personalizedMessage,
      status: "success",
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in personalized message generation:', error);
    return new Response(JSON.stringify({ 
      error: error.message || "Unknown error",
      status: "error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
