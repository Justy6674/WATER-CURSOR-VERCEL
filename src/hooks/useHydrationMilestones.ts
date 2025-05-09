
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useHydrationMessages } from "./useHydrationMessages";

interface MilestoneOptions {
  showToasts?: boolean;
  showConfetti?: boolean;
  setShowConfetti?: (show: boolean) => void;
  setShowVictoryAnimation?: (show: boolean) => void;
}

export function useHydrationMilestones(options: MilestoneOptions = {}) {
  const { sendMessage, sendAchievementMessage } = useHydrationMessages();

  const [milestonesReached, setMilestonesReached] = useState<Record<string, boolean>>({
    "25": false,
    "50": false,
    "75": false,
    "100": false,
  });

  const lastPercentage = useRef<number>(0);
  const {
    showToasts = true,
    showConfetti = true,
    setShowConfetti,
    setShowVictoryAnimation,
  } = options;

  // --- Reset milestones at midnight ---
  useEffect(() => {
    const resetMilestones = () => {
      setMilestonesReached({
        "25": false,
        "50": false,
        "75": false,
        "100": false,
      });
      lastPercentage.current = 0;
      console.log("Hydration milestones reset for new day");
    };

    // Reset immediately if it's a new day since last visit
    const lastDateStr = localStorage.getItem('last-hydration-date');
    const today = new Date().toDateString();
    
    if (lastDateStr && lastDateStr !== today) {
      resetMilestones();
    }
    
    // Store today's date
    localStorage.setItem('last-hydration-date', today);
    
    // Set up interval to check for midnight
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        resetMilestones();
      }
    }, 60 * 1000); // every minute

    return () => clearInterval(interval);
  }, []);

  // --- Debug logging ---
  useEffect(() => {
    console.log("Current milestones state:", milestonesReached);
  }, [milestonesReached]);

  // --- Check if a new milestone is reached ---
  const checkMilestones = useCallback((percentage: number) => {
    // Ensure percentage is valid
    if (isNaN(percentage) || percentage < 0) {
      console.error("Invalid percentage value:", percentage);
      return;
    }
    
    const prevPercentage = lastPercentage.current;
    lastPercentage.current = percentage;
    
    console.log(`Checking milestones: previous=${prevPercentage.toFixed(1)}%, current=${percentage.toFixed(1)}%`);

    if (percentage <= prevPercentage) return;

    const newMilestones = { ...milestonesReached };

    const milestones = [
      { level: 25, message: "🎉 25% of your daily goal reached! Keep going!" },
      { level: 50, message: "🎉 50% reached! Halfway to your goal!" },
      { level: 75, message: "🎉 75% done! Almost there!" },
      { level: 100, message: "🎊 100%! You hit your hydration goal! 🌊" },
    ];

    milestones.forEach(({ level, message }) => {
      const key = level.toString();
      if (prevPercentage < level && percentage >= level && !milestonesReached[key]) {
        console.log(`Milestone ${level}% reached!`);
        newMilestones[key] = true;

        if (showConfetti && setShowConfetti) {
          console.log(`Triggering confetti for ${level}% milestone`);
          setShowConfetti(true);
          setTimeout(() => {
            if (setShowConfetti) setShowConfetti(false);
          }, 3000);
        }

        if (level === 100 && setShowVictoryAnimation) {
          console.log("Triggering 100% victory animation");
          setShowVictoryAnimation(true);
          setTimeout(() => {
            if (setShowVictoryAnimation) setShowVictoryAnimation(false);
          }, 3000);
        }

        try {
          if (level === 100) {
            console.log("Sending 100% achievement message");
            sendAchievementMessage(message);
          } else {
            console.log(`Sending ${level}% milestone message`);
            sendMessage(message, "achievement");
          }
        } catch (error) {
          console.error(`Error sending hydration message for ${level}% milestone:`, error);
        }

        if (showToasts) {
          if (level === 100) {
            toast.success("🎉 You've achieved your daily hydration goal!");
          } else {
            toast.success(`🎯 ${level}% hydration milestone reached!`);
          }
        }
      }
    });

    setMilestonesReached(newMilestones);
  }, [milestonesReached, sendMessage, sendAchievementMessage, showConfetti, setShowConfetti, setShowVictoryAnimation, showToasts]);

  return { checkMilestones, milestonesReached };
}
