
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Leaf } from "lucide-react";

export function TipsSection() {
  return (
    <Card className="bg-white/5 border-downscale-brown/20">
      <CardHeader className="flex flex-row items-center gap-4">
        <Leaf className="h-6 w-6 text-downscale-blue" />
        <h2 className="text-2xl font-semibold text-downscale-brown">Tips to Improve Water Intake</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 text-downscale-cream/80">
          <ul className="space-y-4">
            <li>
              <span className="font-semibold">Temperature and Flavour:</span> Adjust the temperature and flavour of your water to make it more enjoyable. Try adding slices of cucumber, lemon, mint, or some protein water for a taste change.
            </li>
            <li>
              <span className="font-semibold">Daily Schedule:</span> Break your day into thirds:
              <ul className="ml-6 mt-2 space-y-1">
                <li>• Wake-up to 11am: 1 litre</li>
                <li>• 11am to 4pm: 1 litre</li>
                <li>• 4pm until bed-time: 0.5 litre</li>
              </ul>
            </li>
          </ul>
          
          <div className="pt-4 border-t border-downscale-brown/20">
            <h3 className="font-semibold mb-2">How Much Water Should You Drink?</h3>
            <p>
              Aim for at least 2.5-3 litres of water per day, but adjust based on your body weight, activity level, and climate. The frequent trips to the toilet will reduce in time.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
