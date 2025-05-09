
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useProfileTypeFix } from './useProfileTypeFix';
import { toast } from 'sonner';

export const useExternalNotifications = () => {
  const { user } = useAuth();
  const { fixProfileData } = useProfileTypeFix();

  const sendExternalNotification = async (message: string, userEmail?: string) => {
    if (!user) {
      console.log('No user authenticated, skipping notification');
      return;
    }

    try {
      // Get user's notification preferences with type fix
      const result = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id);
        
      console.log('Raw profile data for notifications:', result);
      const { data, error } = fixProfileData(result);
        
      if (error) {
        console.error('Error fetching user reminder preferences:', error);
        return;
      }
        
      if (!data || !data.reminders_enabled) {
        console.log('External notifications disabled or no profile found');
        return;
      }

      if (!data.phone_number || !data.phone_number.startsWith('+')) {
        console.log('No valid phone number available for reminders');
        return;
      }

      console.log('Checking delivery options:', {
        method: data.reminder_method,
        phoneProvided: !!data.phone_number,
        emailProvided: !!data.email,
        enabled: data.reminders_enabled
      });
      
      // Try primary notification method
      if ((data.reminder_method === 'sms' || data.reminder_method === 'whatsapp') && data.phone_number) {
        try {
          console.log(`Sending ${data.reminder_method} notification to ${data.phone_number}`);
          
          const response = await supabase.functions.invoke('send-hydration-reminder', {
            body: { 
              phone: data.phone_number,
              message,
              method: data.reminder_method
            }
          });
          
          console.log(`${data.reminder_method} reminder response:`, response);
          
          if (response.error) {
            throw new Error(response.error.message || `Failed to send ${data.reminder_method}`);
          }
          
          console.log(`${data.reminder_method} reminder sent successfully`);
          return;
        } catch (e) {
          console.error(`Failed to send ${data.reminder_method} reminder:`, e);
          // Try fallback methods if primary fails
          if (data.reminder_method === 'sms') {
            await tryWhatsAppFallback(data.phone_number, message, data.email || userEmail);
          } else {
            await tryEmailFallback(data.email || userEmail, message);
          }
        }
      } 
      else if (data.reminder_method === 'email' && (data.email || userEmail)) {
        await tryEmailFallback(data.email || userEmail, message);
      }
      else {
        console.log('No valid notification method available. reminder_method:', data.reminder_method);
        
        // Attempt SMS as fallback if no valid method but phone exists
        if (data.phone_number) {
          console.log('Attempting SMS fallback since phone exists but no method specified');
          await trySMSFallback(data.phone_number, message);
        }
      }
    } catch (e) {
      console.error('Error in sendExternalNotification:', e);
      toast.error('Failed to send notification. Check your network connection.');
    }
  };

  const trySMSFallback = async (phone: string, message: string) => {
    try {
      console.log('Attempting SMS delivery as fallback to:', phone);
      const response = await supabase.functions.invoke('send-hydration-reminder', {
        body: { 
          phone,
          message,
          method: 'sms'
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      } else {
        console.log('SMS fallback successful');
      }
    } catch (smsError) {
      console.error('SMS fallback failed:', smsError);
    }
  };

  const tryWhatsAppFallback = async (phone: string, message: string, email?: string) => {
    try {
      console.log('SMS sending failed, attempting WhatsApp as fallback');
      const whatsappResponse = await supabase.functions.invoke('send-hydration-reminder', {
        body: { 
          phone,
          message,
          method: 'whatsapp'
        }
      });
      
      if (whatsappResponse.error) {
        console.error('WhatsApp fallback failed:', whatsappResponse.error);
        await tryEmailFallback(email, message);
      } else {
        console.log('WhatsApp fallback successful');
      }
    } catch (whatsAppError) {
      console.error('WhatsApp fallback attempt failed:', whatsAppError);
      await tryEmailFallback(email, message);
    }
  };

  const tryEmailFallback = async (email: string | undefined, message: string) => {
    if (!email) {
      console.log('No email available for fallback');
      return;
    }

    try {
      console.log('Attempting email delivery to:', email);
      const response = await supabase.functions.invoke('send-hydration-reminder', {
        body: { 
          email,
          message,
          method: 'email'
        }
      });
      
      if (response.error) {
        console.error('Email delivery error:', response.error);
      } else {
        console.log('Email reminder sent successfully');
      }
    } catch (emailError) {
      console.error('Failed to send email reminder:', emailError);
    }
  };

  return { sendExternalNotification };
};
