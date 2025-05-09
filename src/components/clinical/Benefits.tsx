
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Weight } from "lucide-react";

export function Benefits() {
  return (
    <Card className="bg-white/5 border-downscale-brown/20">
      <CardHeader className="flex flex-row items-center gap-4">
        <Weight className="h-6 w-6 text-downscale-blue" />
        <h2 className="text-2xl font-semibold text-downscale-brown">Benefits of Staying Hydrated</h2>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4 text-downscale-cream/80">
          <li className="flex items-start gap-2">
            <span className="font-semibold">Boosts Metabolism:</span>
            Proper hydration helps your body burn calories more efficiently.
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold">Regulates Appetite:</span>
            Staying hydrated can prevent overeating by reducing false hunger signals.
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold">Enhances Physical Performance:</span>
            Hydration improves your ability to exercise and burn calories.
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
