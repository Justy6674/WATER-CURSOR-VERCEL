import { createClient } from 'npm:@supabase/supabase-js@2'; // Using npm specifier
import { corsHeaders } from '../_shared/cors.ts'; // Ensure this path is correct
// Log to check if corsHeaders are imported
console.log('corsHeaders imported:', typeof corsHeaders, corsHeaders);
// Moved helper function to top-level scope
const parseFrequencyToHours = (frequency, userId)=>{
  if (!frequency) return null;
  const lowerFrequency = frequency.toLowerCase();
  if (lowerFrequency === 'daily') return 24;
  const hourMatch = lowerFrequency.match(/every (\d+) hours?/);
  if (hourMatch && hourMatch[1]) return parseInt(hourMatch[1], 10); // Added radix for parseInt
  if (lowerFrequency.includes('every hour')) return 1;
  console.warn(`Unknown or unparseable frequency format: "${frequency}" for user ${userId}`);
  return null;
};
console.log("trigger-scheduled-reminders function definition starts.");
Deno.serve(async (req)=>{
  console.log(`Request received: ${req.method} ${req.url}`);
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request");
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Supabase URL or Service Role Key is missing from environment variables.");
      return new Response(JSON.stringify({
        error: "Server configuration error."
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
    const supabaseAdminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      global: {
        headers: {
          Authorization: `Bearer ${supabaseServiceRoleKey}`
        }
      }
    });
    console.log("Scheduler function started processing at:", new Date().toISOString());
    const currentTime = new Date();
    let remindersSentCount = 0;
    let profilesCheckedCount = 0;
    const { data: profiles, error: profilesError } = await supabaseAdminClient.from('profiles').select('user_id, display_name, phone_number, reminder_frequency, reminder_tone, last_reminder_sent_at').not('phone_number', 'is', null).not('reminder_frequency', 'is', null).not('reminder_tone', 'is', null);
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError.message, JSON.stringify(profilesError));
      throw profilesError; // Re-throw to be caught by the main catch block
    }
    if (!profiles || profiles.length === 0) {
      console.log('No profiles found with active reminder settings.');
      return new Response(JSON.stringify({
        message: 'No profiles to process for reminders.'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      });
    }
    profilesCheckedCount = profiles.length;
    console.log(`Found ${profilesCheckedCount} profiles with reminder settings to check.`);
    for (const profile of profiles){
      console.log(`Processing profile for user_id: ${profile.user_id}, Frequency: ${profile.reminder_frequency}`);
      const reminderIntervalHours = parseFrequencyToHours(profile.reminder_frequency, profile.user_id);
      if (reminderIntervalHours === null) {
        console.log(`Skipping user ${profile.user_id} due to unparsable or missing frequency.`);
        continue;
      }
      let isDue = false;
      if (!profile.last_reminder_sent_at) {
        isDue = true;
        console.log(`Reminder due for ${profile.user_id} (first reminder).`);
      } else {
        const lastSentTime = new Date(profile.last_reminder_sent_at);
        const nextReminderTime = new Date(lastSentTime.getTime() + reminderIntervalHours * 60 * 60 * 1000);
        if (currentTime >= nextReminderTime) {
          isDue = true;
          console.log(`Reminder due for ${profile.user_id}. Last sent: ${lastSentTime.toISOString()}, Next due was: ${nextReminderTime.toISOString()}`);
        } else {
          console.log(`Reminder not yet due for ${profile.user_id}. Next reminder at: ${nextReminderTime.toISOString()}`);
        }
      }
      if (isDue) {
        console.log(`Attempting to generate and send reminder to user ${profile.user_id} (Tone: ${profile.reminder_tone})`);
        try {
          const { data: messageGenerationResponse, error: messageGenerationError } = await supabaseAdminClient.functions.invoke('generate-toned-reminder', {
            body: {
              userId: profile.user_id,
              tone: profile.reminder_tone,
              displayName: profile.display_name
            }
          });
          if (messageGenerationError) {
            console.error(`Error invoking 'generate-toned-reminder' for ${profile.user_id}:`, messageGenerationError.message, JSON.stringify(messageGenerationError));
            continue;
          }
          const messageToSend = messageGenerationResponse?.tonedMessage;
          if (!messageToSend || typeof messageToSend !== 'string' || messageToSend.trim() === "") {
            console.error(`'generate-toned-reminder' for ${profile.user_id} did not return a valid message. Response:`, JSON.stringify(messageGenerationResponse));
            continue;
          }
          console.log(`Generated message for ${profile.user_id}: "${messageToSend}"`);
          const { error: sendSmsError } = await supabaseAdminClient.functions.invoke('send-hydration-reminder', {
            body: {
              userId: profile.user_id,
              phone: profile.phone_number,
              message: messageToSend,
              method: 'sms'
            }
          });
          if (sendSmsError) {
            console.error(`Error invoking 'send-hydration-reminder' for ${profile.user_id}:`, sendSmsError.message, JSON.stringify(sendSmsError));
            continue;
          }
          console.log(`Successfully invoked 'send-hydration-reminder' for ${profile.user_id} to ${profile.phone_number}`);
          const { error: updateProfileError } = await supabaseAdminClient.from('profiles').update({
            last_reminder_sent_at: currentTime.toISOString()
          }).eq('user_id', profile.user_id);
          if (updateProfileError) {
            console.error(`Error updating 'last_reminder_sent_at' for ${profile.user_id}:`, updateProfileError.message, JSON.stringify(updateProfileError));
          } else {
            console.log(`Updated 'last_reminder_sent_at' for ${profile.user_id} to ${currentTime.toISOString()}`);
            remindersSentCount++;
          }
        } catch (invokeChainError) {
          console.error(`Unexpected error during reminder processing for ${profile.user_id}:`, invokeChainError.message, JSON.stringify(invokeChainError));
        }
      }
    }
    console.log("Scheduler function finished processing.");
    return new Response(JSON.stringify({
      message: 'Scheduled reminders processed successfully.',
      profilesChecked: profilesCheckedCount,
      remindersSent: remindersSentCount
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Unhandled error in trigger-scheduled-reminders function:', error.message, JSON.stringify(error));
    return new Response(JSON.stringify({
      error: "Internal server error in scheduler"
    }), {
      headers: {
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
console.log("trigger-scheduled-reminders function definition ends.");
