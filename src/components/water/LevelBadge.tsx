
import { useState, useEffect } from "react";
import { Trophy } from "lucide-react";

interface LevelBadgeProps {
  streak: number;
  percentage: number;
}

export function LevelBadge({ streak, percentage }: LevelBadgeProps) {
  const [animate, setAnimate] = useState(false);
  const [level, setLevel] = useState("");
  const [levelUp, setLevelUp] = useState(false);
  const [previousStreak, setPreviousStreak] = useState(0);

  useEffect(() => {
    // Check for level up
    if (streak > previousStreak && previousStreak > 0) {
      setLevelUp(true);
      setTimeout(() => setLevelUp(false), 3000);
    }
    setPreviousStreak(streak);
    
    // Determine level based on streak
    let newLevel = "";
    if (streak >= 30) newLevel = "Hydration Beast";
    else if (streak >= 21) newLevel = "Hydration Master";
    else if (streak >= 14) newLevel = "Hydration Expert";
    else if (streak >= 7) newLevel = "Hydration Pro";
    else if (streak >= 3) newLevel = "Hydration Adept";
    else if (streak >= 1) newLevel = "Hydration Rookie";
    else newLevel = "Dehydrated";
    
    if (newLevel !== level) {
      setLevel(newLevel);
      setAnimate(true);
      setTimeout(() => setAnimate(false), 1000);
    }
  }, [streak, percentage, previousStreak, level]);

  // Get badge color based on streak
  const getBadgeColor = () => {
    if (streak >= 30) return "bg-purple-700/20 text-purple-300 border-purple-500/30";
    if (streak >= 21) return "bg-red-700/20 text-red-300 border-red-500/30";
    if (streak >= 14) return "bg-yellow-700/20 text-yellow-300 border-yellow-500/30";
    if (streak >= 7) return "bg-green-700/20 text-green-300 border-green-500/30";
    if (streak >= 3) return "bg-blue-700/20 text-blue-300 border-blue-500/30";
    return "bg-gray-700/20 text-gray-300 border-gray-500/30";
  };

  // Get trophy color based on streak
  const getTrophyColor = () => {
    if (streak >= 30) return "text-purple-400";
    if (streak >= 21) return "text-red-400";
    if (streak >= 14) return "text-yellow-400";
    if (streak >= 7) return "text-green-400";
    if (streak >= 3) return "text-blue-400";
    return "text-gray-400";
  };

  if (streak === 0) return null;

  return (
    <div className="relative">
      {levelUp && (
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-downscale-blue/30 backdrop-blur-sm px-4 py-1 rounded-full animate-bounce text-sm">
          Level Up! 🎉
        </div>
      )}
      
      <div 
        className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-all ${getBadgeColor()} ${animate ? "scale-110" : "scale-100"}`}
      >
        <Trophy className={`h-4 w-4 ${getTrophyColor()}`} />
        <div className="flex flex-col">
          <span className="text-xs opacity-80">Current Level:</span>
          <span className="font-bold text-sm">{level}</span>
        </div>
      </div>
    </div>
  );
}
