
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Bell, MessageCircle, CircleAlert, Loader2, Mail, Phone } from "lucide-react";
import { useProfileTypeFix } from "@/hooks/useProfileTypeFix";

interface ProfileSettingsModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

type ReminderMethodType = "sms" | "whatsapp" | "email" | "";

export function ProfileSettingsModal({
  user,
  isOpen,
  onClose,
  onLogout,
}: ProfileSettingsModalProps) {
  const { fixProfileData } = useProfileTypeFix();

  const [isLoading, setIsLoading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [reminderMethod, setReminderMethod] = useState<ReminderMethodType>("");
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [showPhoneField, setShowPhoneField] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [internalOpen, setInternalOpen] = useState(isOpen);
  const [activeTab, setActiveTab] = useState("profile");

  // Sync external and internal open states
  useEffect(() => {
    setInternalOpen(isOpen);
  }, [isOpen]);

  // Handle dialog close properly
  const handleOpenChange = (open: boolean) => {
    setInternalOpen(open);
    if (!open) {
      // Ensure we properly call onClose when dialog is dismissed
      onClose();
    }
  };

  useEffect(() => {
    if (internalOpen && user) {
      fetchUserProfile();
    }
  }, [internalOpen, user]);

  // Set showPhoneField based on reminderMethod
  useEffect(() => {
    // Always show phone field if method is SMS or WhatsApp
    setShowPhoneField(reminderMethod === "sms" || reminderMethod === "whatsapp");
    
    // If the reminder method requires a phone number, automatically switch to the preferences tab
    if (reminderMethod === "sms" || reminderMethod === "whatsapp") {
      setActiveTab("preferences");
    }
  }, [reminderMethod]);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    setFetchError(null);
    
    try {
      console.log("Fetching profile for user ID:", user.id);
      
      // Don't use maybeSingle() here since we might have multiple profiles
      const result = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id);
      
      console.log("Raw profile data from Supabase:", result);
      
      if (result.error) {
        throw result.error;
      }
      
      const { data } = fixProfileData(result);
      console.log("Profile data after type fix:", data);

      if (data) {
        setDisplayName(data.display_name || "");
        setPhoneNumber(data.phone_number || "");
        setEmail(data.email || user.email || "");
        setReminderMethod((data.reminder_method as ReminderMethodType) || "");
        setRemindersEnabled(data.reminders_enabled === true);
        
        console.log("Profile loaded successfully with values:", {
          displayName: data.display_name,
          phoneNumber: data.phone_number, 
          email: data.email,
          reminderMethod: data.reminder_method,
          remindersEnabled: data.reminders_enabled
        });

        // If there's a phone number set, ensure the phone field is visible
        if (data.phone_number) {
          setShowPhoneField(true);
          setActiveTab("preferences");
        }
      } else {
        // Initialize with default values if no profile found
        setDisplayName("");
        setPhoneNumber("");
        setEmail(user.email || "");
        setReminderMethod("");
        setRemindersEnabled(false);
        console.log("No profile found, initialized with defaults");
      }
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      setFetchError(error.message || "Failed to load profile data");
      toast.error("Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  const validatePhoneNumber = (phoneNum: string): boolean => {
    // International phone number format validation
    return /^\+[1-9]\d{1,14}$/.test(phoneNum);
  };

  const validateEmail = (emailAddress: string): boolean => {
    return /\S+@\S+\.\S+/.test(emailAddress);
  };

  const saveProfile = async () => {
    setIsLoading(true);

    if (!displayName.trim()) {
      toast.error("Please enter a display name");
      setIsLoading(false);
      return;
    }

    // Only validate phone number if reminder method requires it or phone number exists
    if ((reminderMethod === "sms" || reminderMethod === "whatsapp") && remindersEnabled) {
      if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
        toast.error("Please enter a valid phone number (e.g., +614xxxxxxxx)");
        setIsLoading(false);
        return;
      }
    }

    if (reminderMethod === "email" && remindersEnabled) {
      if (!email || !validateEmail(email)) {
        toast.error("Please enter a valid email address");
        setIsLoading(false);
        return;
      }
    }

    try {
      console.log("Saving profile with values:", {
        displayName,
        phoneNumber,
        email,
        reminderMethod,
        remindersEnabled
      });
      
      const updates = {
        user_id: user.id,
        display_name: displayName,
        // Always save phone number if provided, regardless of reminder method
        phone_number: phoneNumber || null,
        email: email || user.email,
        reminder_method: remindersEnabled ? reminderMethod : null,
        reminders_enabled: remindersEnabled,
        updated_at: new Date().toISOString(),
      };

      console.log("Sending profile update to Supabase:", updates);

      const { data, error } = await supabase
        .from("profiles")
        .upsert(updates, { onConflict: "user_id" });

      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }

      console.log("Profile updated successfully:", data);
      toast.success("Profile updated successfully");
      
      // Properly close the modal after successful save
      handleOpenChange(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(`Failed to update profile: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestReminder = async () => {
    if (!remindersEnabled) {
      toast.error("Reminders are not enabled. Please enable reminders first.");
      return;
    }

    if ((reminderMethod === "sms" || reminderMethod === "whatsapp") && (!phoneNumber || !validatePhoneNumber(phoneNumber))) {
      toast.error("Please enter a valid phone number before sending a test");
      return;
    }

    if (reminderMethod === "email" && (!email || !validateEmail(email))) {
      toast.error("Please enter a valid email address before sending a test");
      return;
    }

    setIsSendingTest(true);
    setTestStatus('sending');

    try {
      const { data: personalizedData, error: personalizationError } = await supabase.functions.invoke('generate-personalized-message', {
        body: { 
          userName: displayName || "Hydration User", 
          milestoneType: "test notification" 
        }
      });

      let testMessage = "🧪 This is a test reminder from your hydration app! If you received this, your reminders are working properly.";
      
      if (personalizedData?.personalizedMessage) {
        testMessage = `🧪 TEST: ${personalizedData.personalizedMessage}`;
        console.log("Using personalized test message:", testMessage);
      } else if (personalizationError) {
        console.warn("Couldn't generate personalized test message, using default", personalizationError);
      }

      const requestBody = reminderMethod === 'email' 
        ? { email, message: testMessage, method: reminderMethod }
        : { phone: phoneNumber, message: testMessage, method: reminderMethod };

      const { data, error } = await supabase.functions.invoke("send-hydration-reminder", {
        body: requestBody
      });

      console.log("Test reminder response:", { data, error });

      if (error) {
        throw error;
      }
      
      setTestStatus('success');
      toast.success(`Test reminder sent successfully via ${reminderMethod}! Check your ${reminderMethod === 'email' ? 'inbox' : 'device'}.`);
    } catch (error: any) {
      console.error("Error sending test reminder:", error);
      setTestStatus('error');
      toast.error(`Failed to send test reminder: ${error.message || "Check your settings and try again."}`);
    } finally {
      setIsSendingTest(false);
      setTimeout(() => setTestStatus('idle'), 5000);
    }
  };

  return (
    <Dialog open={internalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-downscale-slate border-downscale-brown/20 text-downscale-cream sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-downscale-cream">Profile Settings</DialogTitle>
        </DialogHeader>

        {fetchError && (
          <div className="bg-red-500/20 p-3 rounded-md text-red-100 text-sm mb-4">
            <p className="font-bold">Error loading profile</p>
            <p>{fetchError}</p>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 bg-downscale-blue/10 border border-downscale-brown/20">
            <TabsTrigger 
              value="profile" 
              className="text-downscale-cream data-[state=active]:bg-downscale-blue/20"
            >
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="preferences" 
              className="text-downscale-cream data-[state=active]:bg-downscale-blue/20"
            >
              Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-medium text-downscale-cream">
                Display Name
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
                disabled={isLoading}
                className="bg-opacity-20 bg-white text-downscale-cream border-downscale-brown/30"
              />
              <p className="text-xs text-downscale-cream/70">
                This name will be displayed in your profile and notifications.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-downscale-cream">
                Email
              </Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="bg-opacity-20 bg-white text-downscale-cream border-downscale-brown/30"
              />
              <p className="text-xs text-downscale-cream/70">
                Your email for reminders and notifications.
              </p>
            </div>

            {/* Show phone field on the Profile tab as well */}
            <div className="space-y-2">
              <Label htmlFor="phone-profile" className="text-sm font-medium text-downscale-cream">
                Phone Number
              </Label>
              <Input
                id="phone-profile"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+614xxxxxxxx"
                disabled={isLoading}
                className="bg-opacity-20 bg-white text-downscale-cream border-downscale-brown/30"
              />
              <p className="text-xs text-downscale-cream/70">
                International format required (e.g., +614xxxxxxxx)
              </p>
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
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
                      onValueChange={(value) => setReminderMethod(value as ReminderMethodType)}
                      disabled={isLoading || !remindersEnabled}
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
                            <MessageCircle className="h-4 w-4 mr-2" />
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
                    <p className="text-xs text-downscale-cream/70">
                      If your primary method fails, the system will try alternative methods.
                    </p>
                  </div>

                  {/* Always show phone field in preferences when reminders are enabled */}
                  <div className="space-y-2">
                    <Label htmlFor="phone-prefs" className="text-sm font-medium text-downscale-cream">
                      Phone Number
                    </Label>
                    <Input
                      id="phone-prefs"
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
                      {(reminderMethod === "sms" || reminderMethod === "whatsapp") && !validatePhoneNumber(phoneNumber) ? 
                        "Valid phone number required for SMS/WhatsApp notifications" : ""}
                    </p>
                  </div>

                  <div className="space-y-2 mt-4 pt-4 border-t border-downscale-brown/20">
                    <Label className="text-sm font-medium text-downscale-cream">
                      Test Your Reminders
                    </Label>
                    <p className="text-xs text-downscale-cream/70 mb-2">
                      Send a test notification to verify your settings work correctly
                    </p>
                    <Button
                      type="button"
                      onClick={sendTestReminder}
                      disabled={isSendingTest || !remindersEnabled || !reminderMethod}
                      className={`w-full ${
                        testStatus === 'success' 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : testStatus === 'error'
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-downscale-blue/30 hover:bg-downscale-blue/50'
                      } text-downscale-cream`}
                    >
                      {isSendingTest ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending Test...
                        </>
                      ) : testStatus === 'success' ? (
                        <>
                          <span className="mr-2">✓</span>
                          Test Sent Successfully
                        </>
                      ) : testStatus === 'error' ? (
                        <>
                          <CircleAlert className="h-4 w-4 mr-2" />
                          Test Failed - Retry
                        </>
                      ) : (
                        <>
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Send Test Reminder Now
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Separator className="my-2 bg-downscale-brown/20" />

        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
            className="text-downscale-cream hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={saveProfile}
            disabled={isLoading}
            className="bg-downscale-blue text-white hover:bg-downscale-blue/90"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <div className="pt-4">
          <Button
            variant="danger"
            onClick={onLogout}
            className="w-full"
            disabled={isLoading}
          >
            Log Out
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
