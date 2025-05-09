
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileTypeFix } from './useProfileTypeFix';
import { useExternalNotifications } from './useExternalNotifications';
import { Message, MessageType } from '@/types/message.types';
import { getFallbackMessage, formatTimestamp } from '@/utils/messageUtils';

export function useHydrationMessages() {
  const { user } = useAuth();
  const { fixProfileData } = useProfileTypeFix();
  const [messages, setMessages] = useState<Message[]>([]);
  const { sendExternalNotification } = useExternalNotifications();
  
  const addMessage = useCallback((text: string, type: MessageType = 'info') => {
    const newMessage: Message = {
      id: uuidv4(),
      text,
      type,
      timestamp: Date.now(),
      read: false,
    };
    
    setMessages((prevMessages) => [...prevMessages.slice(-19), newMessage]);
    return newMessage.id;
  }, []);
  
  const markAsRead = useCallback((id: string) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) => (msg.id === id ? { ...msg, read: true } : msg))
    );
  }, []);
  
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);
  
  const sendMessage = useCallback(async (text: string, type: MessageType = 'info') => {
    const messageId = addMessage(text, type);
    
    if ((type === 'reminder' || type === 'achievement') && user) {
      try {
        const profileResult = await supabase
          .from('profiles')
          .select('display_name, email')
          .eq('user_id', user.id)
          .maybeSingle();

        const { data: profileData } = fixProfileData(profileResult);
        const userName = profileData?.display_name || user.email?.split('@')[0] || 'Hydration Champion';
        const userEmail = profileData?.email || user.email;
        const milestoneType = type === 'achievement' ? 'goal completion' : text;

        let finalMessage = text;
        try {
          console.log('Calling Gemini personalization for:', { userName, milestoneType });
          const { data: personalizedData, error: personalizationError } = await supabase.functions.invoke('generate-personalized-message', {
            body: { userName, milestoneType }
          });

          finalMessage = personalizationError ? 
            getFallbackMessage(userName, milestoneType) : 
            personalizedData?.personalizedMessage || getFallbackMessage(userName, milestoneType);
          
          console.log(personalizationError ? 
            'Using fallback message:' : 
            'Gemini generated message:', finalMessage);
        } catch (geminiError) {
          console.error('Error calling Gemini API:', geminiError);
          finalMessage = getFallbackMessage(userName, milestoneType);
        }

        window.dispatchEvent(
          new CustomEvent('hydration-message', {
            detail: { 
              id: uuidv4(),
              text: finalMessage, 
              type, 
              userId: user.id,
              timestamp: new Date() 
            }
          })
        );

        await sendExternalNotification(finalMessage, userEmail);
      } catch (e) {
        console.error('Error in sendMessage:', e);
      }
    }
    
    return messageId;
  }, [addMessage, user, sendExternalNotification]);
  
  const sendTipMessage = useCallback((text: string) => {
    return addMessage(text, 'tip');
  }, [addMessage]);

  const sendAchievementMessage = useCallback((text: string) => {
    const messageId = addMessage(text, 'achievement');
    
    try {
      const audio = new Audio('/achievement-sound.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio play prevented:', e));
    } catch (e) {
      console.error('Error playing achievement sound:', e);
    }
    
    return messageId;
  }, [addMessage]);
  
  return {
    messages,
    sendMessage,
    sendTipMessage,
    sendAchievementMessage,
    markAsRead,
    clearMessages,
    formatTimestamp,
  };
}
