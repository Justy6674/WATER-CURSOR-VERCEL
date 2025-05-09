import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Phone, MessageSquare, Mail, Check, Loader2, AlertCircle, Clock, Smile, Annoyed, Drama, Meh } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Define types for clarity
type ReminderFrequency = "hourly" | "2hourly" | "3hourly" | "4hourly" | "";
type ReminderTone = "funny" | "rude" | "crude" | "sarcastic" | "kind" | "";

export function NotificationSetup() {
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [reminderFrequency, setReminderFrequency] = useState<ReminderFrequency>("2hourly"); // Default frequency
  const [reminderTone, setReminderTone] = useState<ReminderTone>("kind"); // Default tone
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // TODO: Fetch existing settings (frequency, tone, phone) on mount
  useEffect(() => {
    // Fetch logic would go here
    console.log("TODO: Fetch notification settings for user", user?.id);
    // Example fetch (replace with actual logic):
    // fetchUserSettings().then(settings => {
    //   if (settings) {
    //     setPhoneNumber(settings.phoneNumber || "");
    //     setReminderFrequency(settings.reminderFrequency || "2hourly");
    //     setReminderTone(settings.reminderTone || "kind");
    //   }
    // });
  }, [user]);

  // TODO: Implement validation for phone number if needed
  const validatePhoneNumber = (phone: string): boolean => {
    // Basic validation example (adjust as needed)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  };

  // TODO: Implement saving settings
  const handleSaveSettings = async () => {
    if (!user) {
      toast.error("You must be logged in to save settings.");
      return;
    }
    if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
       toast.error("Please enter a valid phone number in international format.");
       return;
    }
    if (!reminderFrequency || !reminderTone) {
      toast.error("Please select a reminder frequency and tone.");
      return;
    }

    setIsLoading(true);
    setErrorDetails(null);
    console.log("Saving settings:", { userId: user.id, frequency: reminderFrequency, tone: reminderTone, phoneNumber }); // Keep log
    try {
      const { data, error } = await supabase.functions.invoke('save-reminder-settings', {
        body: {
          userId: user.id,
          frequency: reminderFrequency,
          tone: reminderTone,
          phoneNumber: phoneNumber
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Notification settings saved!");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings.", { description: error.message });
      setErrorDetails(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // TODO: Implement sending test reminder
  const sendTestReminder = async () => {
    if (!user) {
      toast.error("You must be logged in.");
      return;
    }
    if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
       toast.error("Please enter a valid phone number to send a test.");
       return;
    }
    if (!reminderTone) {
      toast.error("Please select a reminder tone for the test message.");
      return;
    }

    setIsTesting(true);
    setTestStatus('sending');
    setErrorDetails(null);
    console.log("Sending test trigger:", { userId: user.id, tone: reminderTone, phone: phoneNumber }); // Keep log

    try {
      // 1. Get message from generate function
      console.log("Invoking generate-personalized-message...");
      const { data: geminiData, error: geminiError } = await supabase.functions.invoke('generate-personalized-message', {
        body: {
          userId: user.id, // Pass necessary context
          frequency: reminderFrequency, // Pass frequency if needed for generation
          tone: reminderTone,
          userName: user.user_metadata?.name || 'there'
        }
      });

      if (geminiError) throw geminiError;
      if (geminiData?.error) throw new Error(geminiData.error);
      if (!geminiData?.message) throw new Error("Failed to generate reminder message.");

      const reminderMessage = `🧪 TEST: ${geminiData.message}`;
      console.log("Generated test message:", reminderMessage);

      // 2. Send message via send function
      console.log(`Triggering send-hydration-reminder for ${phoneNumber}...`);
      const { data: sendData, error: sendError } = await supabase.functions.invoke('send-hydration-reminder', {
         body: {
            userId: user.id, // Pass necessary context
            phoneNumber: phoneNumber,
            message: reminderMessage
         }
      });

      if (sendError) throw sendError;
      if (sendData?.error) throw new Error(sendData.error);

      console.log("SMS sent successfully via edge function. SID:", sendData?.sid);
      setTestStatus('success');
      toast.success("Test reminder sent successfully!");
      setTimeout(() => setTestStatus('idle'), 3000); // Reset status after delay

    } catch (error: any) {
      console.error("Error sending test reminder:", error);
      setTestStatus('error');
      toast.error("Failed to send test reminder.", { description: error.message });
      setErrorDetails(error.message);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="bg-white/5 border-downscale-brown/20 mt-6">
      <CardHeader>
        <CardTitle className="text-downscale-cream flex items-center">
          <Phone className="h-5 w-5 mr-2" />
          Notification Settings
        </CardTitle>
        <CardDescription className="text-downscale-cream/80">
          Set up how you want to receive hydration reminders.
          Reminders are always enabled if a frequency and tone are set.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Frequency Selector */}
        <div className="space-y-2">
          <Label htmlFor="reminder-frequency" className="text-sm font-medium text-downscale-cream flex items-center">
            <Clock className="h-4 w-4 mr-2" /> Reminder Frequency
          </Label>
          <Select
            value={reminderFrequency}
            onValueChange={(value) => setReminderFrequency(value as ReminderFrequency)}
            disabled={isLoading}
          >
            <SelectTrigger 
              id="reminder-frequency"
              className="bg-opacity-20 bg-white text-downscale-cream border-downscale-brown/30"
            >
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent className="bg-downscale-slate border-downscale-brown/20">
              <SelectItem value="hourly" className="text-downscale-cream">Every Hour</SelectItem>
              <SelectItem value="2hourly" className="text-downscale-cream">Every 2 Hours</SelectItem>
              <SelectItem value="3hourly" className="text-downscale-cream">Every 3 Hours</SelectItem>
              <SelectItem value="4hourly" className="text-downscale-cream">Every 4 Hours</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tone Selector */}
        <div className="space-y-2">
          <Label htmlFor="reminder-tone" className="text-sm font-medium text-downscale-cream flex items-center">
            <Smile className="h-4 w-4 mr-2" /> Reminder Tone
          </Label>
          <Select
            value={reminderTone}
            onValueChange={(value) => setReminderTone(value as ReminderTone)}
            disabled={isLoading}
          >
            <SelectTrigger 
              id="reminder-tone"
              className="bg-opacity-20 bg-white text-downscale-cream border-downscale-brown/30"
            >
              <SelectValue placeholder="Select tone" />
            </SelectTrigger>
            <SelectContent className="bg-downscale-slate border-downscale-brown/20">
              <SelectItem value="kind" className="text-downscale-cream flex items-center"><Smile className="h-4 w-4 mr-2 text-green-400" />Kind</SelectItem>
              <SelectItem value="funny" className="text-downscale-cream flex items-center"><Drama className="h-4 w-4 mr-2 text-blue-400" />Funny</SelectItem>
              <SelectItem value="sarcastic" className="text-downscale-cream flex items-center"><Meh className="h-4 w-4 mr-2 text-yellow-400" />Sarcastic</SelectItem>
              <SelectItem value="rude" className="text-downscale-cream flex items-center"><Annoyed className="h-4 w-4 mr-2 text-orange-400" />Rude</SelectItem>
              <SelectItem value="crude" className="text-downscale-cream flex items-center"><Annoyed className="h-4 w-4 mr-2 text-red-500" />Crude</SelectItem> 
            </SelectContent>
          </Select>
        </div>

        {/* Phone Number Input - Kept as is */}
        <div className="space-y-2">
          <Label htmlFor="phone-number" className="text-sm font-medium text-downscale-cream">
            Phone Number (for SMS/WhatsApp)
          </Label>
          <Input
            id="phone-number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+614xxxxxxxx"
            disabled={isLoading}
            className="bg-opacity-20 bg-white text-downscale-cream border-downscale-brown/30"
          />
          <p className="text-xs text-downscale-cream/70">
            International format required (e.g., +614xxxxxxxx)
          </p>
          <p className="text-xs text-red-300">
            {!validatePhoneNumber(phoneNumber) && phoneNumber ? 
              "Valid phone number required for SMS/WhatsApp notifications" : ""}
          </p>
        </div>

        {/* Removed Enable Switch and Reminder Method Select */}
        
        {/* Error display */}
        {errorDetails && (
          <Alert variant="destructive" className="bg-red-900/30 border-red-500/50 text-red-300">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorDetails}</AlertDescription>
          </Alert>
        )}

        {/* Save Button */}
        <Button
          type="button"
          onClick={handleSaveSettings}
          disabled={isLoading || !phoneNumber || !validatePhoneNumber(phoneNumber) || !reminderFrequency || !reminderTone} // More robust disable check
          className="w-full bg-downscale-blue text-white hover:bg-downscale-blue/90"
        >
          {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
          Save Notification Settings
        </Button>

        {/* Test Button - Kept logic, may need adjustment based on new state */}
        <div className="space-y-2 mt-4 pt-4 border-t border-downscale-brown/20">
          <Label className="text-sm font-medium text-downscale-cream">
            Test Your Reminders
          </Label>
          <p className="text-xs text-downscale-cream/70 mb-2">
            Send a test notification to verify your settings work correctly.
          </p>
          <Button
            type="button"
            onClick={sendTestReminder}
            disabled={isTesting || !phoneNumber || !validatePhoneNumber(phoneNumber) || !reminderFrequency || !reminderTone} // Disable if missing valid settings
            className={`w-full ${
              testStatus === 'success' 
                ? 'bg-green-600 hover:bg-green-700' 
                : testStatus === 'error'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-downscale-blue/30 hover:bg-downscale-blue/50'
            } text-downscale-cream`}
          >
            {isTesting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending Test...
              </>
            ) : testStatus === 'success' ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Test Sent Successfully
              </>
            ) : testStatus === 'error' ? (
              <>
                <AlertCircle className="h-4 w-4 mr-2" />
                Test Failed - Retry
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Test Reminder Now
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
