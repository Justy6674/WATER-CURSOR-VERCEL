
import { Card, CardContent } from "@/components/ui/card";
import { Coffee, Soup, CupSoda, Apple, BeerOff, Wine, Milk, Utensils } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HydrationOption {
  name: string;
  defaultAmount: number;
  icon: JSX.Element;
  effectivenessPercent: number;
  description: string;
}

interface OtherHydrationOptionsProps {
  onAddHydration: (amount: number, label?: string) => void;
}

export function OtherHydrationOptions({ onAddHydration }: OtherHydrationOptionsProps) {
  const hydrationOptions: HydrationOption[] = [
    { 
      name: "Tea", 
      defaultAmount: 250, 
      icon: <Coffee className="h-5 w-5" />, 
      effectivenessPercent: 90,
      description: "Counts as 90% hydration"
    },
    { 
      name: "Herbal Tea", 
      defaultAmount: 300, 
      icon: <Coffee className="h-5 w-5" />, 
      effectivenessPercent: 100,
      description: "Counts as 100% hydration"
    },
    { 
      name: "Electrolyte Drink", 
      defaultAmount: 500, 
      icon: <CupSoda className="h-5 w-5" />, 
      effectivenessPercent: 100,
      description: "Counts as 100% hydration"
    },
    { 
      name: "Broth/Soup", 
      defaultAmount: 300, 
      icon: <Soup className="h-5 w-5" />, 
      effectivenessPercent: 100,
      description: "Counts as 100% hydration"
    },
    { 
      name: "Water-rich foods", 
      defaultAmount: 150, 
      icon: <Apple className="h-5 w-5" />, 
      effectivenessPercent: 50,
      description: "High water content fruits and vegetables"
    },
    { 
      name: "Alcohol", 
      defaultAmount: 130, 
      icon: <BeerOff className="h-5 w-5" />, 
      effectivenessPercent: 0,
      description: "Does not count for hydration"
    },
    { 
      name: "Coffee", 
      defaultAmount: 200, 
      icon: <Coffee className="h-5 w-5" />, 
      effectivenessPercent: 80,
      description: "Counts as 80% hydration"
    },
    { 
      name: "Iced Coffee", 
      defaultAmount: 450, 
      icon: <Coffee className="h-5 w-5" />, 
      effectivenessPercent: 80,
      description: "Counts as 80% hydration"
    },
    { 
      name: "Sports Drink", 
      defaultAmount: 600, 
      icon: <CupSoda className="h-5 w-5" />, 
      effectivenessPercent: 100,
      description: "Counts as 100% hydration"
    },
    { 
      name: "Milk", 
      defaultAmount: 250, 
      icon: <Milk className="h-5 w-5" />, 
      effectivenessPercent: 90,
      description: "Counts as 90% hydration"
    },
    { 
      name: "Orange Juice", 
      defaultAmount: 250, 
      icon: <CupSoda className="h-5 w-5" />, 
      effectivenessPercent: 90,
      description: "Counts as 90% hydration"
    },
    { 
      name: "Coconut Water", 
      defaultAmount: 330, 
      icon: <CupSoda className="h-5 w-5" />, 
      effectivenessPercent: 95,
      description: "Counts as 95% hydration"
    },
    { 
      name: "Wine", 
      defaultAmount: 150, 
      icon: <Wine className="h-5 w-5" />, 
      effectivenessPercent: 0,
      description: "Does not count for hydration"
    },
    { 
      name: "Yogurt", 
      defaultAmount: 170, 
      icon: <Milk className="h-5 w-5" />, 
      effectivenessPercent: 85,
      description: "Counts as 85% hydration"
    },
    { 
      name: "Ice Cream", 
      defaultAmount: 120, 
      icon: <Milk className="h-5 w-5" />, 
      effectivenessPercent: 60,
      description: "Counts as 60% hydration"
    },
    { 
      name: "Oatmeal", 
      defaultAmount: 240, 
      icon: <Utensils className="h-5 w-5" />, 
      effectivenessPercent: 85,
      description: "Counts as 85% hydration"
    }
  ];

  const handleAddHydration = (option: HydrationOption) => {
    const effectiveAmount = Math.round(option.defaultAmount * (option.effectivenessPercent / 100));
    onAddHydration(effectiveAmount, `${option.name} (${option.effectivenessPercent}%)`);
  };

  return (
    <Card className="w-full mt-4 bg-downscale-slate border-downscale-brown/30">
      <CardContent className="pt-6">
        <h3 className="text-xl font-semibold text-center mb-4 text-downscale-cream">
          Log Other Hydration
        </h3>
        
        <ScrollArea className="h-[400px] px-1">
          <div className="space-y-3 pb-6">
            {hydrationOptions.map((option) => (
              <button
                key={option.name}
                onClick={() => handleAddHydration(option)}
                className="w-full flex items-center gap-4 p-4 rounded-lg bg-downscale-slate/80 border border-downscale-brown/20 hover:bg-downscale-brown/10 hover:border-downscale-brown/30 transition-all duration-200 group text-left"
              >
                <div className="bg-downscale-brown/10 p-3 rounded-lg shrink-0 group-hover:bg-downscale-brown/20 transition-colors">
                  {option.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-downscale-cream">
                      {option.name}
                    </span>
                    <span className="text-lg font-medium text-downscale-brown shrink-0">
                      {option.defaultAmount}ml
                    </span>
                  </div>
                  
                  <div className="text-sm text-downscale-cream/70 mt-0.5">
                    {option.description}
                  </div>
                  
                  {option.effectivenessPercent < 100 && (
                    <div className="text-xs text-downscale-cream/60 mt-1">
                      Counts as {option.effectivenessPercent}% hydration
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
