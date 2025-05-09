
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Phone, MessageSquare, Mail, Check, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProfileTypeFix } from "@/hooks/useProfileTypeFix";

export function PhoneVerificationPanel() {
  const { user } = useAuth();
  const { fixProfileData } = useProfileTypeFix();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [reminderMethod, setReminderMethod] = useState<"sms" | "whatsapp" | "email" | "">("");
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [verified, setVerified] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      console.log("PhoneVerificationPanel: Fetching profile for user ID:", user.id);
      
      const result = await supabase
        .from('profiles')
        .select('phone_number, reminder_method, reminders_enabled')
        .eq('user_id', user.id)
        .maybeSingle();
      
      const { data } = fixProfileData(result);
      
      if (data) {
        setPhoneNumber(data.phone_number || "");
        setReminderMethod((data.reminder_method as "sms" | "whatsapp" | "email" | "") || "");
        setRemindersEnabled(data.reminders_enabled === true);
        setVerified(!!data.phone_number);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error("Failed to load your profile data");
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    return /^\+[1-9]\d{1,14}$/.test(phone);
  };

  const savePhoneNumber = async () => {
    if (!user) return;
    
    if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
      toast.error('Please enter a valid phone number (e.g., +614xxxxxxxx)');
      return;
    }

    setIsLoading(true);
    
    try {
      const updates = {
        user_id: user.id,
        phone_number: phoneNumber,
        reminder_method: reminderMethod || null,
        reminders_enabled: remindersEnabled,
        updated_at: new Date().toISOString()
      };
      
      console.log("Saving phone data:", updates);
      
      const { error } = await supabase
        .from('profiles')
        .upsert(updates, { onConflict: 'user_id' });
      
      if (error) throw error;
      
      setVerified(true);
      toast.success('Phone number saved successfully');
    } catch (error: any) {
      console.error('Error saving phone number:', error);
      toast.error(`Failed to save: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestMessage = async () => {
    if (!phoneNumber || !validatePhoneNumber(phoneNumber) || !reminderMethod) {
      toast.error('Please enter a valid phone number and select a notification method');
      return;
    }

    setIsTesting(true);
    setTestStatus('sending');

    try {
      const testMessage = "🧪 This is a test message from your hydration app! Your notification settings are working correctly.";
      
      let requestBody;
      if (reminderMethod === 'email') {
        // Use user's email from auth
        requestBody = {
          email: user?.email,
          message: testMessage,
          method: reminderMethod
        };
      } else {
        requestBody = {
          phone: phoneNumber,
          message: testMessage,
          method: reminderMethod
        };
      }
      
      const { data, error } = await supabase.functions.invoke('send-hydration-reminder', {
        body: requestBody
      });

      if (error) throw error;
      
      console.log("Test message response:", data);
      setTestStatus('success');
      toast.success(`Test notification sent successfully via ${reminderMethod}!`);
    } catch (error: any) {
      console.error('Error sending test message:', error);
      setTestStatus('error');
      toast.error(`Test failed: ${error.message || 'Check your number and try again'}`);
    } finally {
      setIsTesting(false);
      setTimeout(() => setTestStatus('idle'), 5000);
    }
  };

  const getMethodIcon = () => {
    switch (reminderMethod) {
      case 'sms': return <Phone className="h-5 w-5 mr-2" />;
      case 'whatsapp': return <MessageSquare className="h-5 w-5 mr-2" />;
      case 'email': return <Mail className="h-5 w-5 mr-2" />;
      default: return null;
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
          Set up how you want to receive hydration reminders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-downscale-brown/20">
            <div className="space-y-0.5">
              <Label htmlFor="reminders-toggle" className="text-sm font-medium text-downscale-cream">
                Enable Reminders
              </Label>
              <p className="text-xs text-downscale-cream/70">
                Get hydration reminders throughout the day
              </p>
            </div>
            <Switch
              id="reminders-toggle"
              checked={remindersEnabled}
              onCheckedChange={setRemindersEnabled}
              disabled={isLoading}
            />
          </div>

          {remindersEnabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="reminder-method" className="text-sm font-medium text-downscale-cream">
                  Reminder Method
                </Label>
                <Select
                  value={reminderMethod}
                  onValueChange={(value) => setReminderMethod(value as "sms" | "whatsapp" | "email")}
                  disabled={isLoading}
                >
                  <SelectTrigger 
                    id="reminder-method"
                    className="bg-opacity-20 bg-white text-downscale-cream border-downscale-brown/30"
                  >
                    <SelectValue placeholder="Select a method" />
                  </SelectTrigger>
                  <SelectContent className="bg-downscale-slate border-downscale-brown/20">
                    <SelectItem value="sms" className="text-downscale-cream">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2" />
                        <span>SMS</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="whatsapp" className="text-downscale-cream">
                      <div className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        <span>WhatsApp</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="email" className="text-downscale-cream">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2" />
                        <span>Email</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(reminderMethod === 'sms' || reminderMethod === 'whatsapp') && (
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-downscale-cream">
                    Phone Number <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="phone"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+614xxxxxxxx"
                    disabled={isLoading}
                    className="bg-opacity-20 bg-white text-downscale-cream border-downscale-brown/30"
                  />
                  <p className="text-xs text-downscale-cream/70">
                    International format required (e.g., +614xxxxxxxx)
                  </p>
                  {phoneNumber && !validatePhoneNumber(phoneNumber) && (
                    <p className="text-xs text-red-400 mt-1">
                      Please enter a valid international phone number starting with + followed by country code
                    </p>
                  )}
                </div>
              )}
              
              <div className="pt-4 flex gap-4">
                <Button
                  onClick={savePhoneNumber}
                  disabled={isLoading || ((reminderMethod === 'sms' || reminderMethod === 'whatsapp') && (!phoneNumber || !validatePhoneNumber(phoneNumber)))}
                  className="bg-downscale-blue text-white hover:bg-downscale-blue/90"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Settings'
                  )}
                </Button>
                
                <Button
                  type="button"
                  onClick={sendTestMessage}
                  disabled={isTesting || !remindersEnabled || !reminderMethod || 
                    ((reminderMethod === 'sms' || reminderMethod === 'whatsapp') && (!phoneNumber || !validatePhoneNumber(phoneNumber)))}
                  className={`${
                    testStatus === 'success' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : testStatus === 'error'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-downscale-brown/50 hover:bg-downscale-brown/70'
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
                      <span className="mr-2">✗</span>
                      Test Failed - Retry
                    </>
                  ) : (
                    <>
                      {getMethodIcon()}
                      Send Test Notification
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
