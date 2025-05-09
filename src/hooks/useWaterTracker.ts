
import { useState, useEffect, useRef } from "react";
import { WaterLogEntry } from "@/components/water/WaterHistory";

const DAILY_GOAL = 3000; // 3 liters = 3000ml
const STORAGE_KEY = "water-tracker-data";

interface WaterTrackerData {
  dailyLogs: Record<string, {
    date: string;
    amount: number;
    goal: number;
    completed: boolean;
  }>;
  streak: number;
  completedDays: number;
}

export const useWaterTracker = (userId: string) => {
  // Use refs to prevent hook ordering issues
  const todayRef = useRef(new Date().toISOString().split('T')[0]);
  
  // All state hooks must be called unconditionally
  const [currentAmount, setCurrentAmount] = useState(0);
  const [dailyGoal] = useState(DAILY_GOAL);
  const [streak, setStreak] = useState(0);
  const [completedDays, setCompletedDays] = useState(0);
  const [history, setHistory] = useState<WaterLogEntry[]>([]);
  
  // Initial data load effect
  useEffect(() => {
    if (!userId) return;
    
    try {
      const storedData = localStorage.getItem(`${STORAGE_KEY}-${userId}`);
      
      if (storedData) {
        const data: WaterTrackerData = JSON.parse(storedData);
        
        // Set the current amount for today
        if (data.dailyLogs[todayRef.current]) {
          setCurrentAmount(data.dailyLogs[todayRef.current].amount);
        } else {
          setCurrentAmount(0);
        }
        
        // Set streak and completed days
        setStreak(data.streak);
        setCompletedDays(data.completedDays);
        
        // Set history
        const historyData = Object.values(data.dailyLogs);
        setHistory(historyData);
      }
    } catch (error) {
      console.error("Error loading water tracker data:", error);
    }
  }, [userId]);

  // Data save effect
  useEffect(() => {
    if (!userId || currentAmount <= 0) return;
    
    try {
      // First, load existing data to avoid overwriting
      const storedData = localStorage.getItem(`${STORAGE_KEY}-${userId}`);
      let data: WaterTrackerData = {
        dailyLogs: {},
        streak,
        completedDays,
      };
      
      if (storedData) {
        data = JSON.parse(storedData);
      }
      
      // Update today's data
      data.dailyLogs[todayRef.current] = {
        date: todayRef.current,
        amount: currentAmount,
        goal: dailyGoal,
        completed: currentAmount >= dailyGoal,
      };
      
      data.streak = streak;
      data.completedDays = completedDays;
      
      // Save back to localStorage
      localStorage.setItem(`${STORAGE_KEY}-${userId}`, JSON.stringify(data));
      
      // Update history state
      setHistory(Object.values(data.dailyLogs));
    } catch (error) {
      console.error("Error saving water tracker data:", error);
    }
  }, [userId, currentAmount, streak, completedDays, dailyGoal]);

  // Handle adding water
  const addWater = (amount: number) => {
    const newAmount = currentAmount + amount;
    setCurrentAmount(newAmount);
    
    // Check if completing goal for the first time today
    if (currentAmount < dailyGoal && newAmount >= dailyGoal) {
      setCompletedDays(prev => prev + 1);
      
      // Check if yesterday was completed to update streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      try {
        const storedData = localStorage.getItem(`${STORAGE_KEY}-${userId}`);
        if (storedData) {
          const data: WaterTrackerData = JSON.parse(storedData);
          
          if (data.dailyLogs[yesterdayStr]?.completed) {
            setStreak(prev => prev + 1);
          } else if (!data.dailyLogs[todayRef.current]) {
            // If this is the first entry today and yesterday wasn't completed, reset streak
            setStreak(1);
          }
        } else {
          // First entry ever
          setStreak(1);
        }
      } catch {
        setStreak(1);
      }
    }
  };

  return {
    currentAmount,
    dailyGoal,
    streak,
    completedDays,
    history,
    addWater,
  };
};
