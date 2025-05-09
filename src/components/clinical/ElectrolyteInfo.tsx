
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Battery } from "lucide-react";

export function ElectrolyteInfo() {
  return (
    <Card className="bg-white/5 border-downscale-brown/20">
      <CardHeader className="flex flex-row items-center gap-4">
        <Battery className="h-6 w-6 text-downscale-blue" />
        <h2 className="text-2xl font-semibold text-downscale-brown">Electrolyte Balance</h2>
      </CardHeader>
      <CardContent className="space-y-4 text-downscale-cream/80">
        <p>
          Electrolytes like sodium, potassium, calcium, magnesium, and chloride are essential for fluid balance.
        </p>
        <p>
          Consuming foods high in electrolytes or drinking electrolyte-enhanced beverages can help maintain this balance, especially during intense exercise or hot weather.
        </p>
      </CardContent>
    </Card>
  );
}
