
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { WaterRing } from "./WaterRing";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Droplet, 
  GlassWater, 
  CupSoda
} from "lucide-react";
import { toast } from "sonner";
import { ConfettiOverlay } from "./ConfettiOverlay";
import { useSimplifiedWaterTracker } from "@/hooks/useSimplifiedWaterTracker";

export function SimpleWaterTracker() {
  const { waterGoal } = useAuth();
  const { 
    currentAmount,
    addWater,
    streak,
    completedDays
  } = useSimplifiedWaterTracker();
  
  const [customAmount, setCustomAmount] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [amountToGo, setAmountToGo] = useState(waterGoal);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [previousPercentage, setPreviousPercentage] = useState(0);
  
  const percentage = waterGoal > 0 ? Math.min(100, (currentAmount / waterGoal) * 100) : 0;
  
  useEffect(() => {
    setAmountToGo(Math.max(0, waterGoal - currentAmount));
    
    // Show confetti when reaching 100%
    if (previousPercentage < 100 && percentage >= 100) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    
    setPreviousPercentage(percentage);
  }, [currentAmount, waterGoal, percentage, previousPercentage]);

  const quickAddOptions = [
    { name: "Small Glass", amount: 150, icon: <CupSoda className="h-5 w-5" /> },
    { name: "Medium Glass", amount: 250, icon: <GlassWater className="h-5 w-5" /> },
    { name: "Large Glass", amount: 500, icon: <Droplet className="h-5 w-5" /> },
    { name: "Water Bottle", amount: 750, icon: <Droplet className="h-5 w-5" /> },
  ];

  const handleQuickAdd = async (amount: number, label?: string) => {
    await addWater(amount);
    
    // Additional confetti for milestone celebrations
    const newAmount = currentAmount + amount;
    const newPercentage = (newAmount / waterGoal) * 100;
    
    if (
      (previousPercentage < 25 && newPercentage >= 25) ||
      (previousPercentage < 50 && newPercentage >= 50) ||
      (previousPercentage < 75 && newPercentage >= 75) ||
      (previousPercentage < 100 && newPercentage >= 100)
    ) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
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
      
      <Card className="bg-white/5 border-downscale-brown/20 relative overflow-hidden">
        <CardContent className="flex flex-col items-center pt-6">
          <div className="flex flex-col items-center justify-center w-full max-w-md">
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
                  <span>🏆</span>
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
          
          <div className="mt-6 w-full max-w-md">
            {showCustomInput ? (
              <div className="flex space-x-2">
                <Input
                  id="custom-amount"
                  type="number"
                  placeholder="Enter amount in ml"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="bg-downscale-blue/20 border-downscale-brown/30 text-downscale-cream placeholder:text-downscale-cream/50"
                />
                <Button 
                  onClick={handleCustomAmount}
                  className="bg-downscale-blue/40 hover:bg-downscale-blue/50 text-downscale-cream"
                >
                  Add
                </Button>
              </div>
            ) : (
              <Button 
                onClick={toggleCustomInput}
                className="w-full bg-downscale-blue/20 hover:bg-downscale-blue/30 text-downscale-cream border border-downscale-brown/20"
              >
                <Plus className="h-5 w-5 mr-2" />
                Custom Amount
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
