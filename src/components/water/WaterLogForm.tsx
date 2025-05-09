
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface WaterLogFormProps {
  onAddWater: (amount: number) => void;
}

export function WaterLogForm({ onAddWater }: WaterLogFormProps) {
  const [customAmount, setCustomAmount] = useState<string>("");

  const handlePresetAmount = (amount: number) => {
    onAddWater(amount);
    toast.success(`Added ${amount}ml of water`);
  };

  const handleCustomAmount = () => {
    const amount = parseInt(customAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    onAddWater(amount);
    toast.success(`Added ${amount}ml of water`);
    setCustomAmount("");
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-downscale-brown">Log your water intake</h3>
      
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className="border-downscale-blue border-2 text-downscale-cream hover:bg-downscale-blue/20"
          onClick={() => handlePresetAmount(250)}
        >
          + 250ml
        </Button>
        
        <Button
          variant="outline"
          className="border-downscale-blue border-2 text-downscale-cream hover:bg-downscale-blue/20"
          onClick={() => handlePresetAmount(500)}
        >
          + 500ml
        </Button>
        
        <Button
          variant="outline"
          className="border-downscale-blue border-2 text-downscale-cream hover:bg-downscale-blue/20"
          onClick={() => handlePresetAmount(1000)}
        >
          + 1000ml
        </Button>
        
        <Button
          variant="default"
          onClick={() => handlePresetAmount(1500)}
        >
          + 1500ml
        </Button>
      </div>
      
      <div className="flex space-x-2">
        <Input
          type="number"
          placeholder="Custom amount (ml)"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          className="bg-opacity-20 bg-white text-downscale-cream border-downscale-brown/30 placeholder:text-downscale-cream/50"
        />
        
        <Button
          className="bg-downscale-blue text-white hover:bg-downscale-blue/90"
          onClick={handleCustomAmount}
        >
          Add
        </Button>
      </div>
    </div>
  );
}
