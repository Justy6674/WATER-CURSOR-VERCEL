import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useHydrationMessages } from '@/hooks/useHydrationMessages';
import { toast } from 'sonner';
import { useProfileTypeFix } from '@/hooks/useProfileTypeFix';

interface ReminderSystemProps {
  userId: string;
}

export function ReminderSystem({ userId }: ReminderSystemProps) {
  const { sendMessage } = useHydrationMessages();
  const { fixProfileData } = useProfileTypeFix();
  const [isInitialized, setIsInitialized] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [reminderMethod, setReminderMethod] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchUserReminders = async () => {
      if (!userId) return;
      
      try {
        console.log("ReminderSystem: Fetching profile for user ID:", userId);
        
        const result = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId);
        
        console.log("ReminderSystem: Raw profile data:", result);
        
        const { data, error } = fixProfileData(result);
        
        if (error) {
          console.error("ReminderSystem: Error fetching profile:", error);
          return;
        }
        
        if (data) {
          const remindersEnabled = !!data.reminders_enabled;
          setRemindersEnabled(remindersEnabled);
          setReminderMethod(data.reminder_method);
          setPhoneNumber(data.phone_number);
          setEmail(data.email);
          
          console.log('Reminder system initialized:', {
            userId,
            remindersEnabled,
            method: data.reminder_method || 'not set',
            phoneValid: !!data.phone_number && data.phone_number.startsWith('+'),
            emailValid: !!data.email && data.email.includes('@')
          });
        } else {
          console.log("ReminderSystem: No profile found for user", userId);
        }
        
        setIsInitialized(true);
      } catch (err) {
        console.error('Error in ReminderSystem:', err);
      }
    };
    
    fetchUserReminders();
  }, [userId]);
  
  useEffect(() => {
    const handleHydrationEvent = async (event: Event) => {
      if (!isInitialized || !userId) return;
      
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail;
      
      console.log('Received hydration message event:', {
        type: detail?.type,
        text: detail?.text,
        remindersEnabled,
        reminderMethod
      });
      
      if ((detail?.type === 'reminder' || detail?.type === 'achievement') && remindersEnabled) {
        try {
          const result = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', userId)
            .maybeSingle();
          
          const { data: userData } = fixProfileData(result);
          
          const userName = userData?.display_name || 'Hydration Champion';
          const milestoneType = detail.type === 'achievement' ? 'goal completion' : detail.text;

          let finalMessage = detail.text;
          try {
            const { data: personalizedData, error: personalizationError } = await supabase.functions.invoke('generate-personalized-message', {
              body: { userName, milestoneType }
            });

            if (personalizationError) {
              console.error('Error generating personalized message:', personalizationError);
              finalMessage = getFallbackMessage(userName, milestoneType);
              console.log('Gemini personalization failed, using fallback.');
            } else {
              finalMessage = personalizedData?.personalizedMessage || getFallbackMessage(userName, milestoneType);
              console.log('Gemini generated message:', finalMessage);
            }
          } catch (geminiError) {
            console.error('Gemini API error:', geminiError);
            finalMessage = getFallbackMessage(userName, milestoneType);
            console.log('Gemini personalization failed, using fallback.');
          }
          
          const profileResult = await supabase
            .from('profiles')
            .select('reminders_enabled, phone_number, reminder_method, email')
            .eq('user_id', userId)
            .maybeSingle();
            
          const { data: profileData, error: profileError } = fixProfileData(profileResult);
            
          if (profileError) {
            console.error('Error fetching user reminder preferences:', profileError);
            return;
          }
            
          if (!profileData || !profileData.reminders_enabled) {
            console.log('External notifications disabled or no profile found');
            return;
          }

          if ((profileData.reminder_method === 'sms' || profileData.reminder_method === 'whatsapp') && profileData.phone_number) {
            try {
              const response = await supabase.functions.invoke('send-hydration-reminder', {
                body: { 
                  phone: profileData.phone_number,
                  message: finalMessage,
                  method: profileData.reminder_method
                }
              });
              
              if (response.error) {
                throw new Error(response.error.message);
              }
              
              console.log(`Reminder sent successfully via ${profileData.reminder_method}`);
            } catch (primaryError) {
              console.error(`Error sending ${profileData.reminder_method} reminder:`, primaryError);
              
              if (profileData.reminder_method === 'sms' && profileData.phone_number) {
                try {
                  console.log('SMS sending failed, attempting WhatsApp fallback.');
                  const whatsappResponse = await supabase.functions.invoke('send-hydration-reminder', {
                    body: { 
                      phone: profileData.phone_number,
                      message: finalMessage,
                      method: 'whatsapp'
                    }
                  });
                  
                  if (whatsappResponse.error) {
                    throw new Error(whatsappResponse.error.message);
                  }
                  
                  console.log('WhatsApp fallback successful');
                } catch (whatsappError) {
                  console.error('WhatsApp fallback failed:', whatsappError);
                  
                  if (profileData.email) {
                    try {
                      console.log('WhatsApp sending failed, attempting email fallback.');
                      const emailResponse = await supabase.functions.invoke('send-hydration-reminder', {
                        body: { 
                          email: profileData.email,
                          message: finalMessage,
                          method: 'email'
                        }
                      });
                      
                      if (emailResponse.error) {
                        throw new Error(emailResponse.error.message);
                      }
                      
                      console.log('Email fallback successful');
                    } catch (emailError) {
                      console.error('Email fallback failed:', emailError);
                      console.log('All reminder channels failed.');
                      throw emailError;
                    }
                  } else {
                    console.log('No email available for fallback. All reminder channels failed.');
                    throw whatsappError;
                  }
                }
              } else if (profileData.email) {
                try {
                  console.log('WhatsApp sending failed, attempting email fallback.');
                  const emailResponse = await supabase.functions.invoke('send-hydration-reminder', {
                    body: { 
                      email: profileData.email,
                      message: finalMessage,
                      method: 'email'
                    }
                  });
                  
                  if (emailResponse.error) {
                    throw new Error(emailResponse.error.message);
                  }
                  
                  console.log('Email reminder sent successfully');
                } catch (emailError) {
                  console.error('Email reminder failed:', emailError);
                  console.log('All reminder channels failed.');
                  throw emailError;
                }
              }
            }
          } else if (profileData.reminder_method === 'email' && profileData.email) {
            try {
              const emailResponse = await supabase.functions.invoke('send-hydration-reminder', {
                body: { 
                  email: profileData.email,
                  message: finalMessage,
                  method: 'email'
                }
              });
              
              if (emailResponse.error) {
                throw new Error(emailResponse.error.message);
              }
              
              console.log('Email reminder sent successfully');
            } catch (emailError) {
              console.error('Email reminder failed:', emailError);
              console.log('All reminder channels failed.');
              throw emailError;
            }
          }
        } catch (err) {
          console.error('Error in hydration event handler:', err);
          toast.error('Unable to send reminder notification');
        }
      }
    };
    
    window.addEventListener('hydration-message', handleHydrationEvent);
    
    return () => {
      window.removeEventListener('hydration-message', handleHydrationEvent);
    };
  }, [isInitialized, sendMessage, userId, remindersEnabled, reminderMethod, phoneNumber, email]);
  
  const getFallbackMessage = (name: string, milestone: string): string => {
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
  };
  
  return null;
}
