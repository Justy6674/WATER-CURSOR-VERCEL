
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Phone, Loader2 } from "lucide-react";
import { useProfileTypeFix } from "@/hooks/useProfileTypeFix";

interface ProfileVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
}

export function ProfileVerificationModal({
  isOpen,
  onClose,
  onVerified
}: ProfileVerificationModalProps) {
  const { user } = useAuth();
  const { fixProfileData } = useProfileTypeFix();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (isOpen && user) {
      fetchUserProfile();
    }
  }, [isOpen, user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const result = await supabase
        .from('profiles')
        .select('display_name, phone_number')
        .eq('user_id', user.id)
        .maybeSingle();
      
      const { data } = fixProfileData(result);
      
      if (data) {
        setPhoneNumber(data.phone_number || "");
        setDisplayName(data.display_name || user.email?.split('@')[0] || "");
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
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
        display_name: displayName || user.email?.split('@')[0] || 'User',
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('profiles')
        .upsert(updates, { onConflict: 'user_id' });
      
      if (error) throw error;
      
      toast.success('Phone number verified successfully');
      onVerified();
    } catch (error: any) {
      console.error('Error saving phone number:', error);
      toast.error(`Failed to save: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestMessage = async () => {
    if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
      toast.error('Please enter a valid phone number before sending a test');
      return;
    }

    setIsTesting(true);
    setTestStatus('sending');

    try {
      const testMessage = "🧪 This is a test message from your hydration app! Your phone number verification is successful.";
      
      const { data, error } = await supabase.functions.invoke('send-hydration-reminder', {
        body: { 
          phone: phoneNumber,
          message: testMessage,
          method: 'sms'
        }
      });

      if (error) throw error;
      
      setTestStatus('success');
      toast.success('Test message sent successfully! Check your phone.');
    } catch (error: any) {
      console.error('Error sending test message:', error);
      setTestStatus('error');
      toast.error(`Test failed: ${error.message || 'Check your number and try again'}`);
    } finally {
      setIsTesting(false);
      setTimeout(() => setTestStatus('idle'), 5000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="bg-downscale-slate border-downscale-brown/20 text-downscale-cream sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-downscale-cream">Phone Verification Required</DialogTitle>
          <DialogDescription className="text-downscale-cream/80">
            Please verify your phone number to continue using the app. This is required for reminders and notifications.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
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
          </div>

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

          <div className="pt-2">
            <Button
              type="button"
              onClick={sendTestMessage}
              disabled={isTesting || !phoneNumber || !validatePhoneNumber(phoneNumber)}
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
                  <span className="mr-2">✓</span>
                  Test Sent Successfully
                </>
              ) : testStatus === 'error' ? (
                <>
                  <span className="mr-2">✗</span>
                  Test Failed - Retry
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4 mr-2" />
                  Test Phone Number
                </>
              )}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={savePhoneNumber}
            disabled={isLoading || !phoneNumber || !validatePhoneNumber(phoneNumber)}
            className="w-full bg-downscale-blue text-white hover:bg-downscale-blue/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Verify & Continue'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
