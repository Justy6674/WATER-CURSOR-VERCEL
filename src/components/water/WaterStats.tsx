
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Trophy, Droplets, Target, Award } from "lucide-react";

interface WaterStatsProps {
  dailyGoal: number;
  currentAmount: number;
  streak?: number;
  completedDays?: number;
}

export function WaterStats({ 
  dailyGoal,
  currentAmount,
  streak = 0,
  completedDays = 0,
}: WaterStatsProps) {
  const remainingAmount = Math.max(0, dailyGoal - currentAmount);
  const percentComplete = Math.min(100, (currentAmount / dailyGoal) * 100);
  
  const getMlDisplay = (ml: number) => {
    if (ml >= 1000) {
      return `${(ml / 1000).toFixed(1)}L`;
    }
    return `${ml}ml`;
  };
  
  const getMessage = () => {
    if (percentComplete >= 100) return "🏆 Champion! You've crushed your daily goal!";
    if (percentComplete >= 75) return "🎯 Almost there! Just a bit more!";
    if (percentComplete >= 50) return "💧 Halfway there! Keep the momentum!";
    if (percentComplete >= 25) return "💪 Good start! Stay motivated!";
    return "🌊 Start your hydration journey!";
  };

  const getStreakEmoji = (streakCount: number) => {
    if (streakCount >= 30) return "🏆";
    if (streakCount >= 14) return "🔥";
    if (streakCount >= 7) return "⭐";
    if (streakCount >= 3) return "✨";
    return "🎯";
  };

  return (
    <Card className="bg-white/5 border-downscale-brown/20">
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-downscale-cream/70 flex items-center gap-2">
              <Droplets className="w-4 h-4" /> Today
            </p>
            <p className="text-2xl font-semibold text-downscale-cream">{getMlDisplay(currentAmount)}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-downscale-cream/70 flex items-center gap-2">
              <Target className="w-4 h-4" /> Goal
            </p>
            <p className="text-2xl font-semibold text-downscale-cream">{getMlDisplay(dailyGoal)}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-downscale-cream/70">Remaining</p>
            <p className="text-2xl font-semibold text-downscale-cream">{getMlDisplay(remainingAmount)}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-downscale-cream/70">Progress</p>
            <p className="text-2xl font-semibold text-downscale-cream">{percentComplete.toFixed(0)}%</p>
          </div>
        </div>
        
        <Separator className="my-4 bg-downscale-cream/10" />
        
        <div className="space-y-1">
          <h4 className="font-medium text-downscale-cream flex items-center gap-2">
            <Trophy className="w-4 h-4" /> Daily Achievement
          </h4>
          <p className="text-downscale-cream/90">{getMessage()}</p>
        </div>
        
        <Separator className="my-4 bg-downscale-cream/10" />
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-downscale-cream/70 flex items-center gap-2">
              <Award className="w-4 h-4" /> Current Streak
            </p>
            <p className="text-xl font-semibold text-downscale-cream">
              {getStreakEmoji(streak)} {streak} days
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-downscale-cream/70">Total Victories</p>
            <p className="text-xl font-semibold text-downscale-cream">
              🏆 {completedDays} days
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
