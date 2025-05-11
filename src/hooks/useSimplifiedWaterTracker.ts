import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { WaterLogEntry } from "@/types/water.types";
import { useWaterAchievements } from "./useWaterAchievements";

export const useSimplifiedWaterTracker = () => {
  const { user, waterGoal } = useAuth();
  const { streak, completedDays, checkAndUpdateStreak, setStreak, setCompletedDays } = useWaterAchievements();
  const [loading, setLoading] = useState(true);
  const [currentHistoryAmount, setCurrentHistoryAmount] = useState(0);
  const [history, setHistory] = useState<WaterLogEntry[]>([]);
  const today = new Date().toISOString().split('T')[0];

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setCurrentHistoryAmount(0);
      setHistory([]);
      setStreak(0);
      setCompletedDays(0);
      return;
    }
    setLoading(true);
    try {
      const { data: intakeData, error: intakeError } = await supabase
        .from('water_intake')
        .select('id, intake_date, intake_amount, created_at')
        .eq('user_id', user.id)
        .eq('intake_date', today);

      if (intakeError) throw intakeError;

      let todaysTotalAmount = 0;
      if (intakeData) {
        todaysTotalAmount = intakeData.reduce((sum, entry) => sum + (entry.intake_amount || 0), 0);
        setCurrentHistoryAmount(todaysTotalAmount);

        const formattedHistory: WaterLogEntry[] = intakeData.map(entry => ({
          id: entry.id,
          date: entry.intake_date || today,
          amount: entry.intake_amount || 0,
          goal: waterGoal,
          completed: (entry.intake_amount || 0) >= waterGoal,
        }));
        setHistory(formattedHistory);
      }

      const { data: achievementData, error: achievementError } = await supabase
        .from('achievements')
        .select('streak_days, achievement_date')
        .eq('user_id', user.id)
        .order('achievement_date', { ascending: false })
        .limit(1);

      if (achievementError) throw achievementError;

      if (achievementData && achievementData.length > 0) {
        const latestAchievement = achievementData[0];
        const lastStreakDate = latestAchievement.achievement_date;
        const yesterdayStr = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0];
        
        if (lastStreakDate === today || (lastStreakDate === yesterdayStr && todaysTotalAmount >= waterGoal)) {
          setStreak(latestAchievement.streak_days || 0);
        } else if (lastStreakDate !== today && lastStreakDate !== yesterdayStr) {
          if (todaysTotalAmount < waterGoal) {
            setStreak(0);
          }
          setCompletedDays(latestAchievement.streak_days || 0);
        }
      } else {
        setStreak(0);
        setCompletedDays(0);
      }

    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Could not load data: " + error.message);
      setCurrentHistoryAmount(0);
      setHistory([]);
      setStreak(0);
      setCompletedDays(0);
    } finally {
      setLoading(false);
    }
  }, [user, today, waterGoal, setStreak, setCompletedDays]);

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setCurrentHistoryAmount(0);
      setHistory([]);
      setLoading(false);
      setStreak(0);
      setCompletedDays(0);
    }
  }, [user, fetchData, setStreak, setCompletedDays]);

  const addWater = useCallback(async (amount: number) => {
    if (!user) {
      toast.error("You must be logged in to add water.");
      return;
    }
    if (amount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    const amountBeforeUpdate = currentHistoryAmount;
    const newTotalCurrentAmount = currentHistoryAmount + amount;

    const optimisticEntry: WaterLogEntry = {
      id: Date.now(), 
      amount: amount,
      date: today,
      goal: waterGoal,
      completed: newTotalCurrentAmount >= waterGoal,
    };
    setHistory(prevHistory => [...prevHistory, optimisticEntry]);
    setCurrentHistoryAmount(newTotalCurrentAmount);

    try {
      const entryForDb = {
        user_id: user.id,
        intake_amount: amount,
        intake_date: today,
      };

      const { data: newDbEntry, error } = await supabase
        .from('water_intake')
        .insert(entryForDb)
        .select('id, intake_date, intake_amount, created_at') 
        .single();

      if (error) {
        throw error;
      }

      if (newDbEntry) {
        setHistory(prevHistory =>
          prevHistory.map(entry =>
            entry.id === optimisticEntry.id 
              ? { 
                  id: newDbEntry.id,
                  date: newDbEntry.intake_date || today,
                  amount: newDbEntry.intake_amount || 0,
                  goal: waterGoal,
                  completed: (newDbEntry.intake_amount || 0) >= waterGoal, 
                }
              : entry
          )
        );
        toast.success(`${amount}ml added!`);

        await checkAndUpdateStreak(amountBeforeUpdate, newTotalCurrentAmount, waterGoal);

      } else {
        toast("Water added, but could not confirm details."); 
      }
    } catch (error: any) {
      console.error("Error saving water entry:", error);
      toast.error("Failed to save water entry. " + error.message);
      setCurrentHistoryAmount(amountBeforeUpdate);
      setHistory(prevHistory => prevHistory.filter(entry => entry.id !== optimisticEntry.id));
    }
  }, [user, currentHistoryAmount, today, waterGoal, checkAndUpdateStreak]);

  return {
    loading,
    currentAmount: currentHistoryAmount,
    streak,
    completedDays,
    history,
    today,
    addWater,
    fetchData,
  };
};
