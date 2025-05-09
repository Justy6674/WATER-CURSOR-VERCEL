
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Droplet } from "lucide-react";

export function HydrationBasics() {
  return (
    <Card className="bg-white/5 border-downscale-brown/20">
      <CardHeader className="flex flex-row items-center gap-4">
        <Droplet className="h-6 w-6 text-downscale-blue" />
        <h2 className="text-2xl font-semibold text-downscale-brown">Understanding Hydration</h2>
      </CardHeader>
      <CardContent className="space-y-4 text-downscale-cream/80">
        <p>
          Hydration involves providing your body with the fluids it needs to function properly. Water makes up about 60% of our body weight and is essential for digestion, metabolism, and waste removal.
        </p>
        <p>
          One key process, hydrolysis, breaks down complex molecules into simpler ones that can be easily absorbed by the body. Without enough water, your body can't perform hydrolysis effectively, hindering fat loss and overall function.
        </p>
        <p className="italic">
          Think of it like a house made from bricks and mortar. Your fat cells are the bricks joined together with mortar. We want to break down the mortar and wash away the fat cells forever!
        </p>
      </CardContent>
    </Card>
  );
}
