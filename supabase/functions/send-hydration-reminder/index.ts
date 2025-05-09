
// Follow this setup guide to integrate the Twilio SendGrid SDK: https://docs.sendgrid.com/for-developers/sending-email/typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

interface ReminderRequest {
  phone?: string;
  email?: string;
  message: string;
  method: "sms" | "whatsapp" | "email";
}

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      console.log("Handling CORS preflight request");
      return new Response("ok", { headers: corsHeaders });
    }

    console.log("Processing hydration reminder request");

    // Parse request body
    const body = await req.json();
    const { phone, email, message, method } = body as ReminderRequest;

    console.log(`Request details: method=${method}, phone=${phone || 'not provided'}, email=${email || 'not provided'}`);
    
    // Validate request parameters
    if (!message || typeof message !== "string") {
      console.error("Invalid message content");
      return new Response(
        JSON.stringify({ error: "Invalid message content" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate the method
    if (method !== "sms" && method !== "whatsapp" && method !== "email") {
      console.error(`Invalid notification method: ${method}`);
      return new Response(
        JSON.stringify({ error: "Invalid notification method", provided: method }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For SMS and WhatsApp, validate phone number
    if ((method === "sms" || method === "whatsapp")) {
      if (!phone) {
        console.error("Missing phone number");
        return new Response(
          JSON.stringify({ error: "Phone number is required for SMS/WhatsApp" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate the phone number format
      if (!phone.match(/^\+[1-9]\d{1,14}$/)) {
        console.error(`Invalid phone number format: ${phone}`);
        return new Response(
          JSON.stringify({ error: "Invalid phone number format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // For email method, validate email
    if (method === "email") {
      if (!email) {
        console.error("Missing email address");
        return new Response(
          JSON.stringify({ error: "Email address is required for email method" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Basic email validation
      if (!email.includes('@') || !email.includes('.')) {
        console.error(`Invalid email format: ${email}`);
        return new Response(
          JSON.stringify({ error: "Invalid email format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get environment variables
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
    const twilioWhatsappNumber = Deno.env.get("TWILIO_WHATSAPP_NUMBER") || twilioNumber;
    const sendGridApiKey = Deno.env.get("SENDGRID_API_KEY");
    const senderEmail = Deno.env.get("SENDER_EMAIL") || "hydration@example.com";

    console.log("Checking credentials:");
    console.log(`- TWILIO_ACCOUNT_SID: ${accountSid ? "✓" : "✗"}`);
    console.log(`- TWILIO_AUTH_TOKEN: ${authToken ? "✓" : "✗"}`);
    console.log(`- TWILIO_PHONE_NUMBER: ${twilioNumber ? "✓" : "✗"}`);
    console.log(`- TWILIO_WHATSAPP_NUMBER: ${twilioWhatsappNumber ? "✓" : "✗"}`);
    console.log(`- SENDGRID_API_KEY: ${sendGridApiKey ? "✓" : "✗"}`);

    // Handle SMS or WhatsApp methods
    if (method === "sms" || method === "whatsapp") {
      if (!accountSid || !authToken || !twilioNumber) {
        console.error("Missing Twilio credentials", {
          accountSid: !accountSid,
          authToken: !authToken,
          twilioNumber: !twilioNumber
        });
        
        return new Response(
          JSON.stringify({ 
            error: "Configuration error", 
            detail: "Missing Twilio credentials",
            missing: {
              accountSid: !accountSid,
              authToken: !authToken,
              twilioNumber: !twilioNumber
            }
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const formData = new URLSearchParams();

      console.log(`Preparing to send ${method} message`);

      // Construct body based on method
      if (method === "sms") {
        formData.append("To", phone!);
        formData.append("From", twilioNumber);
        formData.append("Body", message);
        console.log(`SMS to ${phone} from ${twilioNumber}`);
      } else if (method === "whatsapp") {
        formData.append("To", `whatsapp:${phone!}`);
        formData.append("From", `whatsapp:${twilioWhatsappNumber}`);
        formData.append("Body", message);
        console.log(`WhatsApp to ${phone} from ${twilioWhatsappNumber}`);
      }

      // Make the request to Twilio API
      console.log("Sending request to Twilio API");
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`
          },
          body: formData
        });

        const responseText = await response.text();
        console.log(`Raw Twilio response (${response.status}): ${responseText}`);
        
        let result;
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error("Failed to parse Twilio response:", parseError);
          result = { error: "Invalid JSON response from Twilio" };
        }

        // Log result for debugging
        console.log(`${method} message sent status: ${response.status}`);
        if (response.status >= 400) {
          console.error("Twilio API error:", result);
          
          return new Response(
            JSON.stringify({ 
              error: `Failed to send ${method}`, 
              twilioError: result?.message || result?.error_message || "Unknown Twilio error",
              detail: result
            }),
            { status: response.status, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        } else {
          console.log("Twilio API success, SID:", result?.sid);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            method, 
            status: result?.status || "sent",
            sid: result?.sid,
            messageDetails: {
              to: method === "sms" ? phone : `whatsapp:${phone}`,
              from: method === "sms" ? twilioNumber : `whatsapp:${twilioWhatsappNumber}`
            }
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      } catch (fetchError) {
        console.error("Fetch error when calling Twilio API:", fetchError);
        return new Response(
          JSON.stringify({ 
            error: `Network error when calling Twilio API`, 
            detail: fetchError.message
          }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    } 
    // Handle email method using SendGrid
    else if (method === "email") {
      if (!sendGridApiKey) {
        console.error("Missing SendGrid API key");
        return new Response(
          JSON.stringify({ 
            error: "Configuration error", 
            detail: "Missing SendGrid API key"
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      try {
        // Create HTML email content with nice hydration theme
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f9ff; border-radius: 10px;">
            <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #cce3ff;">
              <h1 style="color: #0066cc; margin: 0;">💧 Hydration Reminder</h1>
            </div>
            <div style="padding: 20px 0;">
              <p style="font-size: 18px; line-height: 1.6; color: #444;">${message}</p>
            </div>
            <div style="background-color: #e6f2ff; padding: 15px; border-radius: 5px; margin-top: 20px;">
              <p style="margin: 0; color: #0066cc; font-size: 14px;">Stay hydrated for better health, focus, and energy throughout your day!</p>
            </div>
            <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #888;">
              <p>This is an automated reminder from your Hydration Tracker app.</p>
            </div>
          </div>
        `;

        // SendGrid v3 API
        const sendGridUrl = "https://api.sendgrid.com/v3/mail/send";
        const payload = {
          personalizations: [{ to: [{ email: email }] }],
          from: { email: senderEmail },
          subject: "💧 Hydration Reminder",
          content: [
            { type: "text/plain", value: message },
            { type: "text/html", value: htmlContent }
          ]
        };

        console.log(`Preparing to send email to ${email}`);
        const response = await fetch(sendGridUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${sendGridApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        // Check and log SendGrid response
        if (response.status >= 400) {
          const errorText = await response.text();
          console.error("SendGrid API error:", response.status, errorText);
          return new Response(
            JSON.stringify({ error: "Failed to send email", detail: errorText }),
            { status: response.status, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        console.log("Email sent successfully");
        return new Response(
          JSON.stringify({ success: true, method: "email", status: "sent" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        return new Response(
          JSON.stringify({ error: "Email sending failed", detail: emailError.message }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Should never reach here due to method validation above
    return new Response(
      JSON.stringify({ error: "Unsupported method" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Unexpected error in send-hydration-reminder:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", detail: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
})
