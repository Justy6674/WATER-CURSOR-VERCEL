
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

export const useWaterAchievements = () => {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);
  const [completedDays, setCompletedDays] = useState(0);

  const checkAndUpdateStreak = async (currentAmount: number, newAmount: number, waterGoal: number) => {
    if (!user) return;
    
    try {
      if (currentAmount < waterGoal && newAmount >= waterGoal) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        const { data: yesterdayData } = await supabase
          .from('water_intake')
          .select('intake_amount')
          .eq('user_id', user.id)
          .eq('intake_date', yesterdayStr)
          .single();
        
        let newStreak = 1;
        
        if (yesterdayData && yesterdayData.intake_amount >= waterGoal) {
          const { data: achievements } = await supabase
            .from('achievements')
            .select('streak_days')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (achievements && achievements.length > 0) {
            newStreak = (achievements[0].streak_days || 0) + 1;
          }
        }

        const today = new Date().toISOString().split('T')[0];
        
        await supabase
          .from('achievements')
          .insert([{
            user_id: user.id,
            streak_days: newStreak,
            achievement_date: today
          }]);
        
        setStreak(newStreak);
        setCompletedDays(prev => prev + 1);
        
        const achievementMessage = getStreakAchievementMessage(newStreak);
        const event = new CustomEvent('hydration-message', {
          detail: {
            id: uuidv4(),
            text: achievementMessage,
            type: "achievement",
            timestamp: new Date(),
            read: false
          }
        });
        window.dispatchEvent(event);
        
        if (newStreak > 1) {
          toast.success(`🔥 ${newStreak} day streak! Keep it up!`);
        }
      }
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  const getStreakAchievementMessage = (streakDays: number) => {
    if (streakDays === 3) return "🔥 Three day streak! You're building a great habit!";
    if (streakDays === 7) return "🔥 One week streak! Your kidneys thank you!";
    if (streakDays === 14) return "🔥 Two week streak! You're a hydration hero!";
    if (streakDays === 21) return "🔥 Three week streak! This is becoming second nature!";
    if (streakDays === 30) return "🔥 ONE MONTH STREAK! You're officially a hydration master!";
    if (streakDays === 50) return "🔥 FIFTY DAY STREAK! You're in elite hydration territory now!";
    if (streakDays === 100) return "🔥 100 DAY STREAK! You're a hydration legend!";
    if (streakDays % 10 === 0) return `🔥 ${streakDays} day streak! Incredible consistency!`;
    return `🔥 ${streakDays} day streak! Keep going!`;
  };

  return {
    streak,
    completedDays,
    checkAndUpdateStreak,
    setStreak,
    setCompletedDays
  };
};
