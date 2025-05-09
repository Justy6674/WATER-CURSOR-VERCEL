
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { HelpCircle, Mail, ExternalLink } from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-downscale-slate border-downscale-brown/20 text-downscale-cream max-w-md">
        <DialogHeader>
          <DialogTitle className="text-downscale-cream text-xl flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            <span>Help & Support</span>
          </DialogTitle>
          <DialogDescription className="text-downscale-cream/80">
            Get assistance with your hydration journey
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-downscale-blue/10 p-4 rounded-md border border-downscale-brown/20">
            <h3 className="font-medium text-downscale-cream mb-2">Contact Support</h3>
            <p className="text-sm text-downscale-cream/80 mb-4">
              Questions about your account or need technical assistance? Send us an email.
            </p>
            <Button 
              className="w-full flex items-center justify-center gap-2 bg-downscale-blue hover:bg-downscale-blue/90 text-white"
              onClick={() => window.location.href = "mailto:hello@downscale.com.au"}
            >
              <Mail className="h-4 w-4" />
              <span>Email Support</span>
            </Button>
          </div>
          
          <div className="bg-downscale-blue/10 p-4 rounded-md border border-downscale-brown/20">
            <h3 className="font-medium text-downscale-cream mb-2">Why Hydration Matters</h3>
            <div className="text-sm text-downscale-cream/80 space-y-4">
              <div>
                <h4 className="font-medium mb-2">Understanding Hydration</h4>
                <p className="mb-3">
                  Water makes up about 60% of our body weight and is essential for digestion, metabolism, and waste removal. Through hydrolysis, water helps break down complex molecules into simpler ones that can be easily absorbed by the body.
                </p>
                <p className="mb-3">
                  Think of your body like a house made from bricks and mortar. Your fat cells are the bricks joined together with mortar. Water helps break down this mortar to wash away the fat cells forever!
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Benefits of Staying Hydrated</h4>
                <ul className="list-disc pl-4 space-y-2">
                  <li>Boosts metabolism, helping your body burn calories efficiently</li>
                  <li>Regulates appetite by reducing false hunger signals</li>
                  <li>Enhances physical performance and exercise capacity</li>
                  <li>Improves mood and cognitive function</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Electrolyte Balance</h4>
                <p className="mb-3">
                  Electrolytes like sodium, potassium, calcium, magnesium, and chloride are essential for fluid balance. Consuming foods high in electrolytes or drinking electrolyte-enhanced beverages can help maintain this balance, especially during intense exercise or hot weather.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Daily Hydration Tips</h4>
                <ul className="list-disc pl-4 space-y-2">
                  <li>Break your day into thirds:
                    <ul className="pl-4 mt-1 space-y-1">
                      <li>Wake-up to 11am: 1 litre</li>
                      <li>11am to 4pm: 1 litre</li>
                      <li>4pm until bedtime: 0.5 litre</li>
                    </ul>
                  </li>
                  <li>Aim for 2.5-3 litres daily, adjusting for your activity and climate</li>
                  <li>Try adding cucumber, lemon, or mint for flavor variety</li>
                  <li>Carry a water bottle and set regular reminders</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
