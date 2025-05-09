
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { WaterRing } from "./WaterRing";
import { WaterHistory, WaterLogEntry } from "./WaterHistory";
import { useWaterTracker } from "@/hooks/useWaterTracker";
import { LevelBadge } from "./LevelBadge";
import { ConfettiOverlay } from "./ConfettiOverlay";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Trophy,
  Droplet, 
  GlassWater, 
  CupSoda, 
  Coffee,
  Soup,
  Waves,
  BeerOff,
  Expand
} from "lucide-react";
import { toast } from "sonner";
import { OtherHydrationOptions } from "./OtherHydrationOptions";
import { ReminderSystem } from "./ReminderSystem";
import { supabase } from "@/integrations/supabase/client";
import { VoiceInput } from './VoiceInput';
import { useHydrationMessages } from "@/hooks/useHydrationMessages";

export function WaterTracker() {
  const { waterGoal, user } = useAuth();
  const { 
    currentAmount,
    history,
    dailyGoal,
    streak = 0,
    completedDays = 0,
    addWater
  } = useWaterTracker(user?.id || "");
  const { sendMessage, sendAchievementMessage } = useHydrationMessages();
  
  const [customAmount, setCustomAmount] = useState("");
  const [showVictoryAnimation, setShowVictoryAnimation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [amountToGo, setAmountToGo] = useState(waterGoal);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isOtherHydrationOpen, setIsOtherHydrationOpen] = useState(false);
  const [previousPercentage, setPreviousPercentage] = useState(0);
  const [achievementSound] = useState<HTMLAudioElement | null>(typeof window !== 'undefined' ? new Audio('/achievement-sound.mp3') : null);
  
  const percentage = waterGoal > 0 ? Math.min(100, (currentAmount / waterGoal) * 100) : 0;
  
  useEffect(() => {
    setAmountToGo(Math.max(0, waterGoal - currentAmount));
    
    if (previousPercentage < 100 && percentage >= 100) {
      setShowVictoryAnimation(true);
      setShowConfetti(true);
      
      if (achievementSound) {
        achievementSound.volume = 0.3;
        achievementSound.currentTime = 0;
        achievementSound.play().catch(e => console.log("Audio play error:", e));
      }
      
      setTimeout(() => setShowVictoryAnimation(false), 3000);
    }
    
    setPreviousPercentage(percentage);
  }, [currentAmount, waterGoal, percentage, previousPercentage, achievementSound]);
  
  const safeHistory: WaterLogEntry[] = history || [];
  
  const displayHistory: WaterLogEntry[] = safeHistory.length > 0 ? safeHistory : [
    {
      date: new Date().toISOString(),
      amount: currentAmount,
      goal: waterGoal,
      completed: percentage >= 100
    }
  ];

  const quickAddOptions = [
    { name: "Sip", amount: 50, icon: <Droplet className="h-5 w-5" /> },
    { name: "Small Glass", amount: 150, icon: <CupSoda className="h-5 w-5" /> },
    { name: "Large Glass", amount: 250, icon: <GlassWater className="h-5 w-5" /> },
    { name: "Water Bottle", amount: 600, icon: <Droplet className="h-5 w-5" /> },
  ];
  
  const [reminderTone, setReminderTone] = useState<'kind' | 'funny' | 'forceful' | 'silent'>('kind');

  const handleQuickAdd = async (amount: number, label?: string) => {
    const prevAmount = currentAmount;
    const prevPercentage = (prevAmount / waterGoal) * 100;
    const newAmount = currentAmount + amount;
    const newPercentage = (newAmount / waterGoal) * 100;
    
    await addWater(amount);
    
    // Check for milestone celebrations
    if (prevPercentage < 25 && newPercentage >= 25) {
      setShowConfetti(true);
      sendMessage("🎉 25% of your daily goal reached! Keep up the great work!", "achievement");
    } else if (prevPercentage < 50 && newPercentage >= 50) {
      setShowConfetti(true);
      sendMessage("🎉 Halfway there! You've reached 50% of your hydration goal for today.", "achievement");
    } else if (prevPercentage < 75 && newPercentage >= 75) {
      setShowConfetti(true);
      sendMessage("🎉 75% complete! Almost at your daily goal!", "achievement");
    } else if (prevPercentage < 100 && newPercentage >= 100) {
      setShowConfetti(true);
      setShowVictoryAnimation(true);
      sendAchievementMessage("🎊 Congratulations! You've reached your daily water goal! 🌊");
      setTimeout(() => setShowVictoryAnimation(false), 3000);
    }
    
    toast.custom(() => (
      <div className="bg-downscale-blue/20 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3 animate-fade-in">
        <Droplet className="h-6 w-6 text-downscale-blue animate-bounce" />
        <span className="text-downscale-cream">
          {label ? `Added ${label} (${amount}ml)` : `Added ${amount}ml of water!`}
        </span>
      </div>
    ), { duration: 2000 });
    
    if (prevAmount < waterGoal && (prevAmount + amount) >= waterGoal) {
      setShowVictoryAnimation(true);
      setShowConfetti(true);
      toast.custom(() => (
        <div className="bg-green-500/80 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3 animate-fade-in">
          <Trophy className="h-6 w-6 text-yellow-300 animate-pulse" />
          <span className="text-white font-bold">Daily goal achieved! 🎉</span>
        </div>
      ), { duration: 3000 });
      
      setTimeout(() => setShowVictoryAnimation(false), 3000);
    }
  };

  const handleCustomAmount = () => {
    const amount = parseInt(customAmount);
    if (!isNaN(amount) && amount > 0) {
      handleQuickAdd(amount);
      setCustomAmount("");
      setShowCustomInput(false);
    }
  };

  const toggleCustomInput = () => {
    setShowCustomInput(!showCustomInput);
    if (!showCustomInput) {
      setTimeout(() => {
        document.getElementById('custom-amount')?.focus();
      }, 100);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <ConfettiOverlay show={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      {user && <ReminderSystem userId={user.id} />}
      
      <Card className="bg-white/5 border-downscale-brown/20 relative overflow-hidden">
        {showVictoryAnimation && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in">
            <div className="text-center">
              <Trophy className="h-16 w-16 text-yellow-300 mx-auto mb-4 animate-pulse" />
              <h2 className="text-4xl font-bold text-downscale-cream mb-2">GOAL ACHIEVED!</h2>
              <p className="text-downscale-cream/80">Great job staying hydrated today!</p>
              <div className="mt-6">
                <LevelBadge streak={streak} percentage={percentage} />
              </div>
            </div>
          </div>
        )}
        
        <CardContent className="flex flex-col items-center pt-6">
          <div className="flex flex-col items-center justify-center w-full max-w-md">
            <div className="mb-4">
              <LevelBadge streak={streak} percentage={percentage} />
            </div>
            
            <WaterRing percentage={percentage} size={250} showAnimation={true} />
            
            <div className="mt-4 text-center">
              <p className="text-2xl font-bold text-downscale-cream">
                {amountToGo > 0 
                  ? `${amountToGo >= 1000 ? `${(amountToGo/1000).toFixed(1)}L` : `${amountToGo}ml`} to go` 
                  : "Goal completed! 🎉"}
              </p>
            </div>
            
            <div className="mt-4 flex items-center justify-center gap-4">
              {streak > 0 && (
                <div className="flex items-center gap-1 text-sm text-downscale-cream/80 bg-downscale-blue/10 px-3 py-1 rounded-full">
                  <span>🔥</span>
                  <span>{streak} day streak</span>
                </div>
              )}
              
              {completedDays > 0 && (
                <div className="flex items-center gap-1 text-sm text-downscale-cream/80 bg-downscale-blue/10 px-3 py-1 rounded-full">
                  <Trophy className="h-4 w-4 text-yellow-300" />
                  <span>{completedDays} {completedDays === 1 ? 'day' : 'days'} completed</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 w-full max-w-md">
            <div className="progress-bar-track">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="mt-1 text-center text-sm text-downscale-cream/80">
              {currentAmount >= 1000
                ? `${(currentAmount / 1000).toFixed(1)}L`
                : `${currentAmount}ml`}{" "}
              of{" "}
              {waterGoal >= 1000
                ? `${(waterGoal / 1000).toFixed(1)}L`
                : `${waterGoal}ml`}
            </div>
          </div>
          
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-md">
            {quickAddOptions.map((option) => (
              <button
                key={option.name}
                onClick={() => handleQuickAdd(option.amount, option.name)}
                className="group relative h-24 w-full bg-downscale-blue/20 hover:bg-downscale-blue/30 text-downscale-cream rounded-xl flex flex-col items-center justify-center transition-all hover:scale-105 border border-downscale-brown hover:border-downscale-brown/70 focus:outline-none focus:ring-2 focus:ring-downscale-blue"
              >
                {option.icon}
                <span className="text-sm font-semibold mt-1">{option.name}</span>
                <span className="text-xs opacity-70">{option.amount}ml</span>
                <div className="absolute inset-0 rounded-xl bg-downscale-blue opacity-0 group-hover:opacity-10 group-active:opacity-20 transition-opacity"></div>
              </button>
            ))}
          </div>
          
          <div className="mt-6 w-full max-w-md flex gap-3">
            <VoiceInput onAddWater={handleQuickAdd} />
            
            <button
              onClick={toggleCustomInput}
              className="group relative h-14 flex-1 bg-downscale-blue/20 hover:bg-downscale-blue/30 text-downscale-cream rounded-xl flex items-center justify-center transition-all hover:scale-102 border border-downscale-brown hover:border-downscale-brown/70 focus:outline-none focus:ring-2 focus:ring-downscale-blue"
            >
              <Plus className="h-5 w-5 group-hover:scale-125 transition-transform mr-2" />
              <span className="text-sm font-semibold">Custom Amount</span>
            </button>
          </div>
          
          <div className="mt-3 w-full max-w-md">
            <div className="flex items-center gap-2 mb-4">
              <label className="text-sm text-downscale-cream/70">Reminder Tone:</label>
              <select
                value={reminderTone}
                onChange={(e) => setReminderTone(e.target.value as typeof reminderTone)}
                className="bg-downscale-blue/20 border border-downscale-brown/20 rounded-md px-2 py-1 text-downscale-cream text-sm"
              >
                <option value="kind">Kind</option>
                <option value="funny">Funny</option>
                <option value="forceful">Forceful</option>
                <option value="silent">Silent</option>
              </select>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 w-full max-w-md mt-6">
            <Button 
              variant="ghost" 
              onClick={() => setIsOtherHydrationOpen(!isOtherHydrationOpen)}
              className="text-downscale-cream border border-downscale-brown/20 w-full"
            >
              {isOtherHydrationOpen ? "Hide" : "Show"} Other Hydration Options
            </Button>
          </div>
          
          {isOtherHydrationOpen && (
            <div className="w-full max-w-md">
              <OtherHydrationOptions onAddHydration={handleQuickAdd} />
            </div>
          )}
          
          <div className="hidden">
            <WaterHistory history={displayHistory} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
