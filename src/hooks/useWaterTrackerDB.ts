
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useHydrationMilestones } from "./useHydrationMilestones";
import { useWaterAchievements } from "./useWaterAchievements";
import { useWaterMotivation } from "./useWaterMotivation";
import type { WaterLogEntry } from "@/types/water.types";

export const useWaterTrackerDB = () => {
  const { user, waterGoal } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [history, setHistory] = useState<WaterLogEntry[]>([]);
  const today = new Date().toISOString().split('T')[0];
  
  const { checkMilestones } = useHydrationMilestones({ 
    showToasts: false
  });

  const { 
    streak, 
    completedDays, 
    checkAndUpdateStreak,
    setStreak,
    setCompletedDays 
  } = useWaterAchievements();

  const { getMotivationalMessage } = useWaterMotivation();

  const fetchWaterData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: todayData } = await supabase
        .from('water_intake')
        .select('intake_amount')
        .eq('user_id', user.id)
        .eq('intake_date', today)
        .maybeSingle();

      setCurrentAmount(todayData?.intake_amount || 0);
      
      const { data: historyData, error: historyError } = await supabase
        .from('water_intake')
        .select('*')
        .eq('user_id', user.id)
        .order('intake_date', { ascending: false });

      if (historyError) throw historyError;
      
      const formattedHistory = historyData.map(entry => ({
        id: entry.id,
        date: entry.intake_date,
        amount: entry.intake_amount,
        goal: waterGoal,
        completed: entry.intake_amount >= waterGoal
      }));
      
      setHistory(formattedHistory);
    } catch (error) {
      console.error('Error fetching water data:', error);
      toast.error('Failed to fetch water data');
    } finally {
      setLoading(false);
    }
  }, [user, today, waterGoal]);

  useEffect(() => {
    if (!user) return;
    
    fetchWaterData();
    fetchAchievements();

    const channel = supabase
      .channel('water-tracker-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'water_intake',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchWaterData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'water_intake',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchWaterData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, waterGoal]);

  useEffect(() => {
    if (waterGoal > 0) {
      const percentage = Math.min(100, (currentAmount / waterGoal) * 100);
      checkMilestones(percentage);
    }
  }, [currentAmount, waterGoal, checkMilestones]);

  const fetchAchievements = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setStreak(data[0].streak_days || 0);
        
        const { count: completedCount } = await supabase
          .from('water_intake')
          .select('intake_date', { count: 'exact', head: false })
          .eq('user_id', user.id)
          .gte('intake_amount', waterGoal);
        
        setCompletedDays(completedCount || 0);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };

  const addWater = async (amount: number) => {
    if (!user) return;
    
    try {
      const newAmount = currentAmount + amount;
      
      const { data: existingEntry } = await supabase
        .from('water_intake')
        .select('id, intake_amount')
        .eq('user_id', user.id)
        .eq('intake_date', today)
        .maybeSingle();
      
      if (existingEntry) {
        await supabase
          .from('water_intake')
          .update({ intake_amount: newAmount })
          .eq('id', existingEntry.id);
      } else {
        await supabase
          .from('water_intake')
          .insert([{
            user_id: user.id,
            intake_date: today,
            intake_amount: newAmount
          }]);
          
        const event = new CustomEvent('hydration-message', {
          detail: {
            id: uuidv4(),
            text: getMotivationalMessage(),
            type: "tip",
            timestamp: new Date(),
            read: false
          }
        });
        window.dispatchEvent(event);
      }
      
      setCurrentAmount(newAmount);
      await checkAndUpdateStreak(currentAmount, newAmount, waterGoal);
      toast.success(`Added ${amount}ml of water`);
    } catch (error) {
      console.error('Error adding water:', error);
      toast.error('Failed to add water');
    }
  };
  
  return {
    loading,
    currentAmount,
    dailyGoal: waterGoal,
    streak,
    completedDays,
    history,
    addWater,
  };
};
